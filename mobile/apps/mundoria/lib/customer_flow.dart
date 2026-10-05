import 'package:flutter/material.dart';
import 'package:mundoria_core/mundoria_core.dart';

void openProfileEditor(BuildContext context, MundoriaSession session) {
  Navigator.of(context).push(
    MaterialPageRoute<void>(
      builder: (_) => ProfileEditorPage(session: session),
    ),
  );
}

void openPayments(BuildContext context, MundoriaSession session) {
  Navigator.of(context).push(
    MaterialPageRoute<void>(
      builder: (_) => PaymentsPage(session: session),
    ),
  );
}

class ProfileEditorPage extends StatefulWidget {
  const ProfileEditorPage({super.key, required this.session});

  final MundoriaSession session;

  @override
  State<ProfileEditorPage> createState() => _ProfileEditorPageState();
}

class _ProfileEditorPageState extends State<ProfileEditorPage> {
  late final TextEditingController _name;
  late final TextEditingController _phone;
  late bool _email;
  late bool _push;
  late bool _sms;
  String? _status;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    final profile = widget.session.profile;
    _name = TextEditingController(text: profile?.fullName ?? '');
    _phone = TextEditingController(text: profile?.phone ?? '');
    _email = profile?.emailNotifications ?? true;
    _push = profile?.pushNotifications ?? true;
    _sms = profile?.smsNotifications ?? false;
  }

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final id = widget.session.profile?.id;
    if (id == null) return;
    setState(() {
      _busy = true;
      _status = null;
    });
    try {
      await widget.session.client.from('profiles').update({
        'full_name': _name.text.trim(),
        'phone': _phone.text.trim(),
        'notification_preferences': {
          'email': _email,
          'push': _push,
          'sms': _sms,
        },
      }).eq('id', id);
      await widget.session.reloadProfile();
      if (mounted) setState(() => _status = 'Saved.');
    } catch (error) {
      if (mounted) setState(() => _status = '$error');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _avatar() async {
    final id = widget.session.profile?.id;
    if (id == null) return;
    final picked = await pickGalleryImage();
    if (picked == null) return;
    setState(() => _busy = true);
    try {
      final url = await uploadBytes(
        client: widget.session.client,
        bucket: 'avatars',
        path: '$id/avatar-${DateTime.now().millisecondsSinceEpoch}-${picked.name}',
        bytes: picked.bytes,
        mime: picked.mime,
        publicUrl: true,
      );
      await widget.session.client
          .from('profiles')
          .update({'avatar_url': url}).eq('id', id);
      await widget.session.reloadProfile();
      if (mounted) setState(() => _status = 'Photo saved.');
    } catch (error) {
      if (mounted) setState(() => _status = '$error');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final profile = widget.session.profile;
    final avatar = profile?.avatarUrl;
    final code = profile?.referralCode;
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          if (avatar != null && avatar.startsWith('http'))
            CircleAvatar(radius: 36, backgroundImage: NetworkImage(avatar)),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: _busy ? null : _avatar,
            child: const Text('Change photo'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _name,
            decoration: const InputDecoration(labelText: 'Full name'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _phone,
            decoration: const InputDecoration(labelText: 'Phone'),
            keyboardType: TextInputType.phone,
          ),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Email updates'),
            value: _email,
            onChanged: (value) => setState(() => _email = value),
          ),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Push notifications'),
            value: _push,
            onChanged: (value) => setState(() => _push = value),
          ),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Text messages'),
            value: _sms,
            onChanged: (value) => setState(() => _sms = value),
          ),
          if (code != null && code.isNotEmpty) ...[
            const SizedBox(height: 8),
            const Text('Your referral code', style: TextStyle(color: MundoriaColors.muted)),
            SelectableText(
              code,
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
            ),
          ],
          if (_status != null) ...[
            const SizedBox(height: 12),
            Text(_status!, style: const TextStyle(color: MundoriaColors.ink)),
          ],
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _busy ? null : _save,
            child: const Text('Save profile'),
          ),
        ],
      ),
    );
  }
}

class PaymentsPage extends StatefulWidget {
  const PaymentsPage({super.key, required this.session});

  final MundoriaSession session;

  @override
  State<PaymentsPage> createState() => _PaymentsPageState();
}

class _PaymentsPageState extends State<PaymentsPage> {
  late Future<_PaymentLists> _future;
  String? _status;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<_PaymentLists> _load() async {
    final id = widget.session.profile?.id;
    if (id == null) return const _PaymentLists(due: [], receipts: []);
    final client = widget.session.client;
    final due = await client
        .from('bookings')
        .select('id, service_type, scheduled_date, amount_total, payment_status')
        .eq('customer_id', id)
        .eq('payment_status', 'unpaid')
        .neq('status', 'cancelled')
        .order('scheduled_date');
    final receipts = await client
        .from('bookings')
        .select(
          'id, service_type, scheduled_date, amount_total, tip_pence, payment_status',
        )
        .eq('customer_id', id)
        .eq('payment_status', 'released')
        .order('scheduled_date', ascending: false);
    return _PaymentLists(
      due: due.map((row) => Map<String, dynamic>.from(row)).toList(),
      receipts: receipts.map((row) => Map<String, dynamic>.from(row)).toList(),
    );
  }

  Future<void> _pay(String bookingId) async {
    setState(() => _status = null);
    final api = MundoriaApi(widget.session);
    try {
      final created = await api.post('/api/payments/create-intent', {
        'booking_id': bookingId,
      });
      await confirmApiPayment(Map<String, dynamic>.from(created as Map));
      await api.post('/api/bookings/$bookingId/confirm-payment');
      if (mounted) {
        setState(() {
          _status = 'Payment authorised.';
          _future = _load();
        });
      }
    } on MundoriaApiException catch (error) {
      if (mounted) setState(() => _status = error.message);
    } catch (error) {
      if (mounted) {
        setState(() {
          _status = stripeSheetClosed(error) ? 'The card step was closed.' : '$error';
        });
      }
    }
  }

  Future<void> _portal() async {
    try {
      final body = await MundoriaApi(widget.session).post('/api/stripe/customer-portal');
      final url = (body as Map)['url'];
      if (url is String) await openExternalUrl(url);
    } on MundoriaApiException catch (error) {
      if (mounted) setState(() => _status = error.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Payments & receipts')),
      body: FutureBuilder<_PaymentLists>(
        future: _future,
        builder: (context, snapshot) {
          final lists = snapshot.data;
          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              OutlinedButton(
                onPressed: _portal,
                child: const Text('Manage cards'),
              ),
              if (_status != null) ...[
                const SizedBox(height: 12),
                Text(_status!, style: const TextStyle(color: MundoriaColors.ink)),
              ],
              const SizedBox(height: 20),
              const Text(
                'Payment due',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
              ),
              if (lists == null)
                const Padding(
                  padding: EdgeInsets.all(12),
                  child: CircularProgressIndicator(),
                )
              else if (lists.due.isEmpty)
                const Text('Nothing waiting for a card hold.')
              else
                for (final row in lists.due)
                  ListTile(
                    title: Text(serviceLabel('${row['service_type']}')),
                    subtitle: Text(
                      '${row['scheduled_date']} · ${formatPence((row['amount_total'] as num?)?.round())}',
                    ),
                    trailing: TextButton(
                      onPressed: () => _pay('${row['id']}'),
                      child: const Text('Pay'),
                    ),
                  ),
              const SizedBox(height: 12),
              const Text(
                'Receipts',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
              ),
              if (lists != null && lists.receipts.isEmpty)
                const Text('Receipts appear after a clean is paid.')
              else if (lists != null)
                for (final row in lists.receipts)
                  ListTile(
                    title: Text(serviceLabel('${row['service_type']}')),
                    subtitle: Text('${row['scheduled_date']}'),
                    trailing: Text(formatPence((row['amount_total'] as num?)?.round())),
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute<void>(
                        builder: (_) => ReceiptPage(
                          session: widget.session,
                          row: row,
                        ),
                      ),
                    ),
                  ),
            ],
          );
        },
      ),
    );
  }
}

class _PaymentLists {
  const _PaymentLists({required this.due, required this.receipts});

  final List<Map<String, dynamic>> due;
  final List<Map<String, dynamic>> receipts;
}

class ReceiptPage extends StatefulWidget {
  const ReceiptPage({super.key, required this.session, required this.row});

  final MundoriaSession session;
  final Map<String, dynamic> row;

  @override
  State<ReceiptPage> createState() => _ReceiptPageState();
}

class _ReceiptPageState extends State<ReceiptPage> {
  late Future<List<Map<String, dynamic>>> _addOns;

  @override
  void initState() {
    super.initState();
    _addOns = _load();
  }

  Future<List<Map<String, dynamic>>> _load() async {
    final rows = await widget.session.client
        .from('booking_add_ons')
        .select('label, amount')
        .eq('booking_id', widget.row['id']);
    return rows.map((row) => Map<String, dynamic>.from(row)).toList();
  }

  @override
  Widget build(BuildContext context) {
    final row = widget.row;
    final tip = (row['tip_pence'] as num?)?.round() ?? 0;
    final total = (row['amount_total'] as num?)?.round() ?? 0;
    return Scaffold(
      appBar: AppBar(title: const Text('Receipt')),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _addOns,
        builder: (context, snapshot) {
          final extras = snapshot.data ?? const <Map<String, dynamic>>[];
          final extraTotal = extras.fold<int>(
            0,
            (sum, item) => sum + ((item['amount'] as num?)?.round() ?? 0),
          );
          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Text(
                serviceLabel('${row['service_type']}'),
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 8),
              Text('${row['scheduled_date']}'),
              const SizedBox(height: 16),
              Text('Service ${formatPence(total - extraTotal)}'),
              for (final extra in extras)
                Text(
                  '${extra['label']} ${formatPence((extra['amount'] as num?)?.round())}',
                ),
              if (tip > 0) Text('Tip ${formatPence(tip)}'),
              const SizedBox(height: 8),
              Text(
                formatPence(total),
                style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 12),
              const Text(
                'This is the amount captured for the visit. Card details stay with Stripe.',
                style: TextStyle(color: MundoriaColors.muted, height: 1.4),
              ),
            ],
          );
        },
      ),
    );
  }
}

class CleanerTrack extends StatefulWidget {
  const CleanerTrack({super.key, required this.session, required this.bookingId});

  final MundoriaSession session;
  final String bookingId;

  @override
  State<CleanerTrack> createState() => _CleanerTrackState();
}

class _CleanerTrackState extends State<CleanerTrack> {
  Map<String, dynamic>? _row;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final row = await widget.session.client
        .from('bookings')
        .select(
          'status, cleaner_live_latitude, cleaner_live_longitude, cleaner_location_updated_at',
        )
        .eq('id', widget.bookingId)
        .maybeSingle();
    if (!mounted) return;
    setState(() => _row = row == null ? null : Map<String, dynamic>.from(row));
    Future<void>.delayed(const Duration(seconds: 15), () {
      if (mounted) _load();
    });
  }

  @override
  Widget build(BuildContext context) {
    final row = _row;
    final lat = row?['cleaner_live_latitude'];
    final lng = row?['cleaner_live_longitude'];
    if (row == null ||
        row['status'] != 'cleaner_en_route' ||
        lat is! num ||
        lng is! num) {
      return const SizedBox.shrink();
    }
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Cleaner on the way',
            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
          ),
          const SizedBox(height: 6),
          Text('${lat.toStringAsFixed(5)}, ${lng.toStringAsFixed(5)}'),
          if (row['cleaner_location_updated_at'] != null)
            Text(
              'Updated ${row['cleaner_location_updated_at']}',
              style: const TextStyle(color: MundoriaColors.muted),
            ),
          TextButton(
            onPressed: () => openExternalUrl(
              'https://www.google.com/maps?q=$lat,$lng',
            ),
            child: const Text('Open the map'),
          ),
        ],
      ),
    );
  }
}

class VisitDesk extends StatefulWidget {
  const VisitDesk({super.key, required this.session, required this.visit});

  final MundoriaSession session;
  final Visit visit;

  @override
  State<VisitDesk> createState() => _VisitDeskState();
}

class _CheckItem {
  _CheckItem(this.key, this.label);
  final String key;
  final String label;
  bool done = true;
  final reason = TextEditingController();
}

class _VisitDeskState extends State<VisitDesk> {
  final _note = TextEditingController();
  final _rescheduleDate = TextEditingController();
  final _rescheduleTime = TextEditingController();
  final _pauseStart = TextEditingController();
  final _pauseEnd = TextEditingController();
  final _disputeNote = TextEditingController();
  String _mood = 'good';
  String _dispute = 'bathroom_not_cleaned';
  String? _status;
  bool _busy = false;
  List<_CheckItem> _checks = const [];

  static const _moods = ['excellent', 'good', 'fair', 'bad', 'awful'];
  static const _disputes = <Map<String, Object>>[
    {
      'key': 'bathroom_not_cleaned',
      'label': 'Bathroom was not cleaned',
      'path': ['cleaning_quality', 'missed_area', 'bathroom_not_cleaned'],
    },
    {
      'key': 'kitchen_not_cleaned',
      'label': 'Kitchen was not cleaned',
      'path': ['cleaning_quality', 'missed_area', 'kitchen_not_cleaned'],
    },
    {
      'key': 'floors_not_cleaned',
      'label': 'Floors were not cleaned',
      'path': ['cleaning_quality', 'missed_area', 'floors_not_cleaned'],
    },
    {
      'key': 'dusting_not_done',
      'label': 'Dusting was not done',
      'path': ['cleaning_quality', 'missed_area', 'dusting_not_done'],
    },
    {
      'key': 'checklist_item_missed',
      'label': 'A checklist item was not completed',
      'path': ['cleaning_quality', 'poor_quality', 'checklist_item_missed'],
    },
    {
      'key': 'poor_standard',
      'label': 'Work was done to a poor standard',
      'path': ['cleaning_quality', 'poor_quality', 'poor_standard'],
    },
    {
      'key': 'cleaner_late',
      'label': 'Cleaner arrived late',
      'path': ['timing_attendance', 'cleaner_late'],
    },
    {
      'key': 'cleaner_no_show',
      'label': 'Cleaner did not arrive',
      'path': ['timing_attendance', 'cleaner_no_show'],
    },
    {
      'key': 'left_early',
      'label': 'Cleaner left too early',
      'path': ['timing_attendance', 'left_early'],
    },
    {
      'key': 'item_damaged',
      'label': 'An item was damaged',
      'path': ['property_damage', 'item_damaged'],
    },
    {
      'key': 'item_missing',
      'label': 'An item is missing',
      'path': ['property_damage', 'item_missing'],
    },
    {
      'key': 'access_problem',
      'label': 'There was an access problem',
      'path': ['property_damage', 'access_problem'],
    },
    {
      'key': 'charged_wrong_amount',
      'label': 'I was charged the wrong amount',
      'path': ['payment_refund', 'charged_wrong_amount'],
    },
    {
      'key': 'refund_question',
      'label': 'I need help with a refund',
      'path': ['payment_refund', 'refund_question'],
    },
    {
      'key': 'other',
      'label': 'Something else',
      'path': ['other'],
    },
  ];

  @override
  void initState() {
    super.initState();
    final visit = widget.visit;
    final time = visit.startTime.length >= 5
        ? visit.startTime.substring(0, 5)
        : visit.startTime;
    _rescheduleDate.text = visit.date;
    _rescheduleTime.text = time;
    _pauseStart.text = visit.date;
    _pauseEnd.text = visit.date;
    _loadChecks();
  }

  Future<void> _loadChecks() async {
    final rows = await widget.session.client
        .from('booking_checklist_items')
        .select('item_key, label')
        .eq('booking_id', widget.visit.id)
        .order('sort_order');
    if (!mounted) return;
    setState(() {
      _checks = rows
          .map(
            (row) => _CheckItem(
              '${row['item_key']}',
              '${row['label']}',
            ),
          )
          .toList();
    });
  }

  @override
  void dispose() {
    _note.dispose();
    _rescheduleDate.dispose();
    _rescheduleTime.dispose();
    _pauseStart.dispose();
    _pauseEnd.dispose();
    _disputeNote.dispose();
    for (final item in _checks) {
      item.reason.dispose();
    }
    super.dispose();
  }

  MundoriaApi get _api => MundoriaApi(widget.session);

  Future<void> _run(Future<void> Function() action) async {
    setState(() {
      _busy = true;
      _status = null;
    });
    try {
      await action();
      if (mounted) setState(() => _status = 'Saved.');
    } on MundoriaApiException catch (error) {
      if (mounted) setState(() => _status = error.message);
    } catch (error) {
      if (mounted) {
        setState(() {
          _status = stripeSheetClosed(error) ? 'The card step was closed.' : '$error';
        });
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  String _reason(String fallback) {
    final note = _note.text.trim();
    return note.length >= 3 ? note : fallback;
  }

  @override
  Widget build(BuildContext context) {
    final visit = widget.visit;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        CleanerTrack(session: widget.session, bookingId: visit.id),
        BookingThread(session: widget.session, bookingId: visit.id),
        const SizedBox(height: 20),
        TextField(
          controller: _note,
          decoration: const InputDecoration(
            labelText: 'Note',
            hintText: 'Used for cancel, reschedule, or a rating',
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _rescheduleDate,
          decoration: const InputDecoration(labelText: 'New date (YYYY-MM-DD)'),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _rescheduleTime,
          decoration: const InputDecoration(labelText: 'New time (HH:MM)'),
        ),
        const SizedBox(height: 8),
        OutlinedButton(
          onPressed: _busy
              ? null
              : () => _run(
                    () => _api.post('/api/bookings/${visit.id}/reschedule', {
                      'scheduledDate': _rescheduleDate.text.trim(),
                      'scheduledStartTime': _rescheduleTime.text.trim(),
                      'reason': _note.text.trim(),
                    }),
                  ),
          child: const Text('Reschedule'),
        ),
        if (visit.isRecurring) ...[
          TextField(
            controller: _pauseStart,
            decoration: const InputDecoration(labelText: 'Pause from'),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _pauseEnd,
            decoration: const InputDecoration(labelText: 'Pause until'),
          ),
          const SizedBox(height: 8),
          OutlinedButton(
            onPressed: _busy
                ? null
                : () => _run(
                      () => _api.post('/api/bookings/${visit.id}/pause', {
                        'startsOn': _pauseStart.text.trim(),
                        'endsOn': _pauseEnd.text.trim(),
                      }),
                    ),
            child: const Text('Pause these dates'),
          ),
        ],
        OutlinedButton(
          onPressed: _busy
              ? null
              : () => _run(
                    () => _api.post('/api/bookings/${visit.id}/cancel', {
                      'reason': _reason('Cancelled from the Mundoria app'),
                      'scope': 'visit',
                    }),
                  ),
          child: const Text('Cancel this visit'),
        ),
        if (visit.isRecurring)
          OutlinedButton(
            onPressed: _busy
                ? null
                : () => _run(
                      () => _api.post('/api/bookings/${visit.id}/cancel', {
                        'reason': _reason('Cancelled the series from the app'),
                        'scope': 'series',
                      }),
                    ),
            child: const Text('Cancel the series'),
          ),
        OutlinedButton(
          onPressed: _busy
              ? null
              : () => _run(() => _api.post('/api/bookings/${visit.id}/change-pro')),
          child: const Text('Change pro'),
        ),
        OutlinedButton(
          onPressed: _busy
              ? null
              : () => _run(
                    () => _api.post('/api/bookings/${visit.id}/sos', {
                      'note': _note.text.trim(),
                    }),
                  ),
          child: const Text('SOS'),
        ),
        const SizedBox(height: 16),
        const Text('Checklist', style: TextStyle(fontWeight: FontWeight.w700)),
        if (_checks.isEmpty)
          const Text(
            'No checklist on this visit.',
            style: TextStyle(color: MundoriaColors.muted),
          )
        else
          for (final item in _checks) ...[
            CheckboxListTile(
              value: item.done,
              contentPadding: EdgeInsets.zero,
              title: Text(item.label),
              onChanged: (value) => setState(() => item.done = value ?? true),
            ),
            if (!item.done)
              TextField(
                controller: item.reason,
                decoration: const InputDecoration(labelText: 'Why was this missed?'),
              ),
          ],
        OutlinedButton(
          onPressed: _busy ? null : () => _run(_confirm),
          child: const Text('Confirm the clean is done'),
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          value: _mood,
          decoration: const InputDecoration(labelText: 'Rating'),
          items: [
            for (final mood in _moods)
              DropdownMenuItem(value: mood, child: Text(mood)),
          ],
          onChanged: (value) => setState(() => _mood = value ?? 'good'),
        ),
        const SizedBox(height: 8),
        OutlinedButton(
          onPressed: _busy
              ? null
              : () => _run(
                    () => _api.post('/api/ratings', {
                      'booking_id': visit.id,
                      'mood': _mood,
                      'comment': _note.text.trim(),
                    }),
                  ),
          child: const Text('Send rating'),
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          value: _dispute,
          decoration: const InputDecoration(labelText: 'Dispute'),
          items: [
            for (final option in _disputes)
              DropdownMenuItem(
                value: option['key'] as String,
                child: Text(option['label'] as String),
              ),
          ],
          onChanged: (value) =>
              setState(() => _dispute = value ?? 'bathroom_not_cleaned'),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _disputeNote,
          minLines: 2,
          maxLines: 4,
          decoration: const InputDecoration(labelText: 'What happened?'),
        ),
        const SizedBox(height: 8),
        OutlinedButton(
          onPressed: _busy ? null : () => _run(_raiseDispute),
          child: const Text('Raise a dispute'),
        ),
        const SizedBox(height: 12),
        const Text('Tip', style: TextStyle(fontWeight: FontWeight.w700)),
        Wrap(
          spacing: 8,
          children: [
            for (final amount in [200, 500, 1000])
              OutlinedButton(
                onPressed: _busy ? null : () => _run(() => _tip(amount)),
                child: Text(formatPence(amount)),
              ),
          ],
        ),
        OutlinedButton(
          onPressed: _busy ? null : () => _run(_payFollowOn),
          child: const Text('Pay this visit'),
        ),
        if (_status != null) ...[
          const SizedBox(height: 12),
          Text(_status!, style: const TextStyle(color: MundoriaColors.ink)),
        ],
      ],
    );
  }

  Future<void> _confirm() async {
    final unchecked = <Map<String, String>>[];
    for (final item in _checks) {
      if (item.done) continue;
      final reason = item.reason.text.trim();
      if (reason.length < 3) {
        throw MundoriaApiException('Every unchecked item needs a reason.');
      }
      unchecked.add({
        'item_key': item.key,
        'label': item.label,
        'reason': reason,
      });
    }
    await _api.post('/api/bookings/${widget.visit.id}/confirm-completion', {
      'unchecked_items': unchecked,
    });
  }

  Future<void> _raiseDispute() async {
    final option = _disputes.firstWhere((item) => item['key'] == _dispute);
    await _api.post('/api/disputes', {
      'booking_id': widget.visit.id,
      'selected_option_key': option['key'],
      'category_path': option['path'],
      'description': _disputeNote.text.trim(),
    });
  }

  Future<void> _tip(int amountPence) async {
    final created = await _api.post('/api/bookings/${widget.visit.id}/tip', {
      'amountPence': amountPence,
    });
    final intentId = await confirmApiPayment(Map<String, dynamic>.from(created as Map));
    await _api.post('/api/bookings/${widget.visit.id}/tip/confirm', {
      'paymentIntentId': intentId,
    });
  }

  Future<void> _payFollowOn() async {
    final created = await _api.post('/api/payments/create-intent', {
      'booking_id': widget.visit.id,
    });
    await confirmApiPayment(Map<String, dynamic>.from(created as Map));
    await _api.post('/api/bookings/${widget.visit.id}/confirm-payment');
  }
}
