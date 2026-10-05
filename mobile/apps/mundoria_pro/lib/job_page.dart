import 'dart:async';

import 'package:flutter/material.dart';
import 'package:mundoria_core/mundoria_core.dart';

void openCleanerJob(BuildContext context, MundoriaSession session, Visit visit) {
  Navigator.of(context).push(
    MaterialPageRoute<void>(
      builder: (_) => CleanerJobPage(session: session, visit: visit),
    ),
  );
}

class OffersPanel extends StatefulWidget {
  const OffersPanel({super.key, required this.session});

  final MundoriaSession session;

  @override
  State<OffersPanel> createState() => _OffersPanelState();
}

class _OffersPanelState extends State<OffersPanel> {
  late Future<List<Map<String, dynamic>>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<Map<String, dynamic>>> _load() async {
    final body = await MundoriaApi(widget.session).get('/api/cleaner/offers');
    final offers = (body as Map)['offers'];
    if (offers is! List) return const [];
    return offers.map((item) => Map<String, dynamic>.from(item as Map)).toList();
  }

  Future<void> _respond(String id, String response, {required bool team}) async {
    final api = MundoriaApi(widget.session);
    if (team && response == 'accepted') {
      await api.post('/api/cleaner/jobs/$id/claim-team');
    } else if (!team) {
      await api.post('/api/cleaner/jobs/$id/respond', {'response': response});
    }
    setState(() => _future = _load());
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _future,
      builder: (context, snapshot) {
        final offers = snapshot.data ?? const <Map<String, dynamic>>[];
        if (snapshot.hasError) {
          return Text('${snapshot.error}', style: const TextStyle(color: MundoriaColors.orange));
        }
        if (offers.isEmpty) return const SizedBox.shrink();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Offers',
              style: TextStyle(
                color: MundoriaColors.ink,
                fontSize: 20,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 8),
            for (final offer in offers)
              Container(
                width: double.infinity,
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: MundoriaColors.line),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      serviceLabel('${offer['serviceType']}'),
                      style: const TextStyle(fontWeight: FontWeight.w700, color: MundoriaColors.ink),
                    ),
                    Text(
                      formatVisitWhen(
                        '${offer['scheduledDate']}',
                        '${offer['scheduledStartTime']}',
                      ),
                      style: const TextStyle(color: MundoriaColors.muted),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        TextButton(
                          onPressed: () => _respond(
                            '${offer['id']}',
                            'accepted',
                            team: offer['team'] == true,
                          ),
                          child: const Text('Accept'),
                        ),
                        if (offer['team'] != true)
                          TextButton(
                            onPressed: () => _respond(
                              '${offer['id']}',
                              'declined',
                              team: false,
                            ),
                            child: const Text('Decline'),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
          ],
        );
      },
    );
  }
}

class CleanerJobPage extends StatefulWidget {
  const CleanerJobPage({super.key, required this.session, required this.visit});

  final MundoriaSession session;
  final Visit visit;

  @override
  State<CleanerJobPage> createState() => _CleanerJobPageState();
}

class _CleanerJobPageState extends State<CleanerJobPage> {
  final _note = TextEditingController();
  final _reason = TextEditingController();
  String? _status;
  bool _busy = false;
  Timer? _share;

  @override
  void dispose() {
    _share?.cancel();
    _note.dispose();
    _reason.dispose();
    super.dispose();
  }

  Future<Map<String, dynamic>> _here() async {
    final place = await currentPlace();
    return {'latitude': place.latitude, 'longitude': place.longitude};
  }

  void _startShare() {
    _share?.cancel();
    _share = Timer.periodic(const Duration(seconds: 20), (_) {
      _pushLocation();
    });
    _pushLocation();
  }

  Future<void> _pushLocation() async {
    try {
      final here = await _here();
      await MundoriaApi(widget.session).post(
        '/api/cleaner/jobs/${widget.visit.id}/location',
        here,
      );
    } catch (_) {}
  }

  Future<void> _photo() async {
    final picked = await pickGalleryImage();
    if (picked == null) return;
    final userId = widget.session.profile?.id;
    if (userId == null) return;
    final path =
        '$userId/${widget.visit.id}-${DateTime.now().millisecondsSinceEpoch}-${picked.name}';
    final stored = await uploadBytes(
      client: widget.session.client,
      bucket: 'booking-photos',
      path: path,
      bytes: picked.bytes,
      mime: picked.mime,
    );
    await widget.session.client.from('booking_photos').insert({
      'booking_id': widget.visit.id,
      'cleaner_id': userId,
      'photo_url': stored,
      'area_label': _note.text.trim().isEmpty ? null : _note.text.trim(),
    });
  }

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
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final visit = widget.visit;
    final api = MundoriaApi(widget.session);
    return Scaffold(
      appBar: AppBar(title: Text(serviceLabel(visit.serviceType))),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
        children: [
          Text(formatVisitWhen(visit.date, visit.startTime)),
          if (visit.place.isNotEmpty) Text(visit.place),
          Text(statusLabel(visit.status), style: const TextStyle(color: MundoriaColors.orange)),
          Text(formatPence(visit.amountPence), style: const TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 16),
          BookingThread(session: widget.session, bookingId: visit.id),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: _busy
                ? null
                : () => _run(() async {
                      final here = await _here();
                      await api.post('/api/cleaner/jobs/${visit.id}/action', {
                        'action': 'en_route',
                        ...here,
                      });
                      _startShare();
                    }),
            child: const Text('On the way'),
          ),
          OutlinedButton(
            onPressed: _busy
                ? null
                : () => _run(() async {
                      final here = await _here();
                      await api.post('/api/cleaner/jobs/${visit.id}/action', {
                        'action': 'checkin',
                        ...here,
                      });
                      _share?.cancel();
                    }),
            child: const Text('Check in'),
          ),
          OutlinedButton(
            onPressed: _busy
                ? null
                : () => _run(() async {
                      final here = await _here();
                      await api.post('/api/cleaner/jobs/${visit.id}/action', {
                        'action': 'checkout',
                        ...here,
                      });
                    }),
            child: const Text('Check out'),
          ),
          TextField(
            controller: _reason,
            decoration: const InputDecoration(labelText: 'Override reason'),
          ),
          OutlinedButton(
            onPressed: _busy
                ? null
                : () => _run(() async {
                      final here = await _here();
                      await api.post('/api/cleaner/jobs/${visit.id}/action', {
                        'action': 'override',
                        'reason': _reason.text.trim(),
                        ...here,
                      });
                    }),
            child: const Text('Override check-in'),
          ),
          OutlinedButton(
            onPressed: _busy ? null : () => _run(_photo),
            child: const Text('Add a job photo'),
          ),
          OutlinedButton(
            onPressed: _busy
                ? null
                : () => _run(() => api.post('/api/bookings/${visit.id}/start', {
                      'role': 'cleaner',
                    })),
            child: const Text('Start'),
          ),
          OutlinedButton(
            onPressed: _busy
                ? null
                : () => _run(() => api.post('/api/cleaner/jobs/${visit.id}/confirm-gate', {
                      'confirmed': true,
                    })),
            child: const Text('Confirm I can attend'),
          ),
          OutlinedButton(
            onPressed: _busy
                ? null
                : () => _run(() => api.post('/api/bookings/${visit.id}/sos', {
                      'note': _note.text.trim(),
                    })),
            child: const Text('SOS'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _note,
            decoration: const InputDecoration(labelText: 'Time off note'),
          ),
          const SizedBox(height: 8),
          OutlinedButton(
            onPressed: _busy
                ? null
                : () => _run(() => api.post('/api/cleaner/absence', {
                      'startsOn': visit.date,
                      'endsOn': visit.date,
                      'cancelExisting': false,
                      'note': _note.text.trim(),
                    })),
            child: const Text('Mark this date as time off'),
          ),
          if (_status != null) ...[
            const SizedBox(height: 12),
            Text(_status!),
          ],
        ],
      ),
    );
  }
}
