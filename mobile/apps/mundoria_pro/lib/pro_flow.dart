import 'package:flutter/material.dart';
import 'package:mundoria_core/mundoria_core.dart';

void openCleanerInbox(BuildContext context, MundoriaSession session) {
  Navigator.of(context).push(
    MaterialPageRoute<void>(
      builder: (_) => CleanerInboxPage(session: session),
    ),
  );
}

void openOnboarding(BuildContext context, MundoriaSession session) {
  Navigator.of(context).push(
    MaterialPageRoute<void>(
      builder: (_) => OnboardingPage(session: session),
    ),
  );
}

class CleanerInboxPage extends StatefulWidget {
  const CleanerInboxPage({super.key, required this.session});

  final MundoriaSession session;

  @override
  State<CleanerInboxPage> createState() => _CleanerInboxPageState();
}

class _CleanerInboxPageState extends State<CleanerInboxPage> {
  String? _bookingId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Messages')),
      body: _bookingId == null
          ? FutureBuilder<List<MundoriaMessage>>(
              future: widget.session.messages(),
              builder: (context, snapshot) {
                final messages = snapshot.data ?? const <MundoriaMessage>[];
                return ListView(
                  padding: const EdgeInsets.all(20),
                  children: [
                    if (messages.isEmpty)
                      const Text(
                        'No messages yet.',
                        style: TextStyle(color: MundoriaColors.muted),
                      ),
                    for (final message in messages)
                      ListTile(
                        title: Text(
                          message.content.isEmpty ? 'Photo' : message.content,
                        ),
                        onTap: () => setState(() => _bookingId = message.bookingId),
                      ),
                  ],
                );
              },
            )
          : ListView(
              padding: const EdgeInsets.all(20),
              children: [
                BookingThread(session: widget.session, bookingId: _bookingId!),
              ],
            ),
    );
  }
}

int _visitStreak(List<Visit> jobs) {
  final ordered = jobs
      .where((job) => ['completed', 'cancelled', 'no_show'].contains(job.status))
      .toList()
    ..sort(
      (left, right) => '${right.date}T${right.startTime}'.compareTo(
        '${left.date}T${left.startTime}',
      ),
    );
  var count = 0;
  for (final job in ordered) {
    if (job.status != 'completed') break;
    count += 1;
  }
  return count;
}

class PerformancePanel extends StatelessWidget {
  const PerformancePanel({super.key, required this.session});

  final MundoriaSession session;

  @override
  Widget build(BuildContext context) {
    final id = session.profile?.id;
    if (id == null) return const SizedBox.shrink();
    return FutureBuilder<Map<String, dynamic>?>(
      future: session.client
          .from('cleaner_profiles')
          .select(
            'tier, performance_score, total_jobs, rating, cancellation_count, on_time_rate, status, onboarding_complete',
          )
          .eq('id', id)
          .maybeSingle(),
      builder: (context, snapshot) {
        final row = snapshot.data;
        if (row == null) {
          return const Text(
            'Finish onboarding to see your tier and reliability score.',
            style: TextStyle(color: MundoriaColors.muted),
          );
        }
        final score = row['performance_score'];
        return Container(
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
                'Tier ${row['tier']}',
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
              ),
              const SizedBox(height: 6),
              Text('Reliability score $score'),
              FutureBuilder<List<Visit>>(
                future: session.cleanerVisits(),
                builder: (context, jobs) {
                  final streak = _visitStreak(jobs.data ?? const []);
                  return Text(
                    streak == 0
                        ? 'Streak: none yet'
                        : 'Streak: $streak finished visits in a row',
                  );
                },
              ),
              Text('Jobs ${row['total_jobs']} · rating ${row['rating']}'),
              Text(
                'On time ${row['on_time_rate']}% · cancellations ${row['cancellation_count']}',
              ),
              Text('Status ${row['status']}'),
            ],
          ),
        );
      },
    );
  }
}

class PayoutActions extends StatefulWidget {
  const PayoutActions({super.key, required this.session});

  final MundoriaSession session;

  @override
  State<PayoutActions> createState() => _PayoutActionsState();
}

class _PayoutActionsState extends State<PayoutActions> {
  String? _status;
  bool _busy = false;

  Future<void> _open(String path) async {
    setState(() {
      _busy = true;
      _status = null;
    });
    try {
      final body = await MundoriaApi(widget.session).post(path);
      final url = (body as Map)['url'];
      if (url is! String || url.isEmpty) {
        throw StateError('Stripe did not return a link.');
      }
      await openExternalUrl(url);
    } on MundoriaApiException catch (error) {
      setState(() => _status = error.message);
    } catch (error) {
      setState(() => _status = '$error');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        OutlinedButton(
          onPressed: _busy ? null : () => _open('/api/cleaner/stripe-connect'),
          child: const Text('Set up payouts'),
        ),
        const SizedBox(height: 8),
        OutlinedButton(
          onPressed: _busy ? null : () => _open('/api/cleaner/stripe-dashboard'),
          child: const Text('Open Stripe payouts'),
        ),
        if (_status != null) ...[
          const SizedBox(height: 8),
          Text(_status!, style: const TextStyle(color: MundoriaColors.orange)),
        ],
      ],
    );
  }
}

class DiaryBoard extends StatefulWidget {
  const DiaryBoard({super.key, required this.session});

  final MundoriaSession session;

  @override
  State<DiaryBoard> createState() => _DiaryBoardState();
}

class _DiaryBoardState extends State<DiaryBoard> {
  final _title = TextEditingController();
  final _start = TextEditingController();
  final _end = TextEditingController();
  final _awayStart = TextEditingController();
  final _awayEnd = TextEditingController();
  late Future<Map<String, dynamic>> _future;
  String? _status;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    final today = todayIso();
    _start.text = '${today}T09:00:00';
    _end.text = '${today}T10:00:00';
    _awayStart.text = today;
    _awayEnd.text = today;
    _future = _load();
  }

  @override
  void dispose() {
    _title.dispose();
    _start.dispose();
    _end.dispose();
    _awayStart.dispose();
    _awayEnd.dispose();
    super.dispose();
  }

  String get _from => todayIso();
  String get _to => todayIso(DateTime.now().add(const Duration(days: 14)));

  Future<Map<String, dynamic>> _load() async {
    final body = await MundoriaApi(widget.session).get(
      '/api/cleaner/diary?from=$_from&to=$_to',
    );
    return Map<String, dynamic>.from(body as Map);
  }

  Future<void> _run(Future<void> Function() action) async {
    setState(() {
      _busy = true;
      _status = null;
    });
    try {
      await action();
      _title.clear();
      if (mounted) {
        setState(() {
          _status = 'Saved.';
          _future = _load();
        });
      }
    } on MundoriaApiException catch (error) {
      if (mounted) setState(() => _status = error.message);
    } catch (error) {
      if (mounted) setState(() => _status = '$error');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  String _iso(String raw) {
    return DateTime.parse(raw.trim())
        .toUtc()
        .toIso8601String()
        .replaceFirst(RegExp(r'\.\d+'), '');
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>>(
      future: _future,
      builder: (context, snapshot) {
        final body = snapshot.data;
        final jobs = (body?['jobs'] as List?) ?? const [];
        final events = (body?['events'] as List?) ?? const [];
        final absences = (body?['absences'] as List?) ?? const [];
        return ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
          children: [
            const Text(
              'Diary',
              style: TextStyle(
                color: MundoriaColors.ink,
                fontSize: 28,
                fontWeight: FontWeight.w700,
                letterSpacing: -0.6,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Jobs, plans, and time off for the next two weeks.',
              style: TextStyle(color: MundoriaColors.muted),
            ),
            const SizedBox(height: 16),
            if (snapshot.hasError)
              Text('${snapshot.error}', style: const TextStyle(color: MundoriaColors.orange)),
            for (final job in jobs)
              _line(
                serviceLabel('${(job as Map)['service_type']}'),
                '${job['scheduled_date']} ${job['scheduled_start_time']} · ${job['area'] ?? ''}',
              ),
            for (final event in events)
              _line(
                '${(event as Map)['title']}',
                '${event['starts_at']} – ${event['ends_at']}',
                onDelete: () => _run(
                  () => MundoriaApi(widget.session).delete(
                    '/api/cleaner/diary?id=${event['id']}',
                  ),
                ),
              ),
            for (final absence in absences)
              _line(
                'Time off',
                '${(absence as Map)['starts_on']} – ${absence['ends_on']}',
                onDelete: () => _run(
                  () => MundoriaApi(widget.session).delete(
                    '/api/cleaner/absence?id=${absence['id']}',
                  ),
                ),
              ),
            const SizedBox(height: 16),
            TextField(
              controller: _title,
              decoration: const InputDecoration(labelText: 'Plan name'),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _start,
              decoration: const InputDecoration(labelText: 'Starts (YYYY-MM-DDTHH:MM:SS)'),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _end,
              decoration: const InputDecoration(labelText: 'Ends (YYYY-MM-DDTHH:MM:SS)'),
            ),
            const SizedBox(height: 8),
            FilledButton(
              onPressed: _busy
                  ? null
                  : () => _run(
                        () => MundoriaApi(widget.session).post('/api/cleaner/diary', {
                          'title': _title.text.trim(),
                          'startsAt': _iso(_start.text),
                          'endsAt': _iso(_end.text),
                        }),
                      ),
              child: const Text('Add a plan'),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _awayStart,
              decoration: const InputDecoration(labelText: 'Away from'),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _awayEnd,
              decoration: const InputDecoration(labelText: 'Away until'),
            ),
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: _busy
                  ? null
                  : () => _run(
                        () => MundoriaApi(widget.session).post('/api/cleaner/absence', {
                          'startsOn': _awayStart.text.trim(),
                          'endsOn': _awayEnd.text.trim(),
                          'cancelExisting': false,
                        }),
                      ),
              child: const Text('Add time off'),
            ),
            if (_status != null) ...[
              const SizedBox(height: 12),
              Text(_status!),
            ],
          ],
        );
      },
    );
  }

  Widget _line(String title, String subtitle, {VoidCallback? onDelete}) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(title),
      subtitle: Text(subtitle),
      trailing: onDelete == null
          ? null
          : IconButton(onPressed: onDelete, icon: const Icon(Icons.close)),
    );
  }
}

class OnboardingPage extends StatefulWidget {
  const OnboardingPage({super.key, required this.session});

  final MundoriaSession session;

  @override
  State<OnboardingPage> createState() => _OnboardingPageState();
}

class _ExamQuestion {
  const _ExamQuestion(this.id, this.prompt, this.options);
  final String id;
  final String prompt;
  final List<String> options;
}

const _exam = [
  _ExamQuestion('dbs', 'Before working in customer homes, Mundoria expects cleaners to have:', [
    'A clear DBS check on file',
    'Only a verbal reference',
    'No background check if experienced',
    'A driving licence only',
  ]),
  _ExamQuestion('supplies', 'Unless the booking says otherwise, who usually brings cleaning products and tools?', [
    'The customer always provides everything',
    'The cleaner, unless the booking notes say otherwise',
    'Mundoria delivers a kit to every job',
    'Neighbours may lend supplies',
  ]),
  _ExamQuestion('accept', 'When you receive a job offer, you should:', [
    'Ignore it — Mundoria will auto-assign',
    'Accept or decline within the respond-by window',
    'Message the customer off-platform first',
    'Show up without confirming',
  ]),
  _ExamQuestion('offplatform', 'Taking payment or arranging future cleans outside Mundoria is:', [
    'Allowed if the customer asks',
    'Fine after the first session',
    'Against platform rules',
    'Required for cash jobs',
  ]),
  _ExamQuestion('checkin', 'Check-in / check-out location sharing is used to:', [
    'Track you all day for marketing',
    'Create an audit trail for arrival and completion disputes',
    'Share your live location with all customers forever',
    'Replace messaging entirely',
  ]),
  _ExamQuestion('damage', 'If something is damaged or goes wrong during a clean, you should:', [
    'Leave without saying anything',
    'Only tell friends',
    'Report it honestly via Mundoria as soon as practical',
    'Offer a private cash refund off-platform',
  ]),
  _ExamQuestion('noshow', 'If you cannot make a confirmed booking, you should:', [
    'Not respond and hope it goes away',
    'Tell Mundoria as early as you can so the customer can be protected',
    'Send a personal WhatsApp only',
    'Arrive late without notice',
  ]),
  _ExamQuestion('standard', 'A high-quality clean usually means:', [
    'Rushing through to maximise jobs per day',
    'Following the booking brief, checklist, and agreed rooms carefully',
    'Skipping bathrooms if short on time',
    'Using whatever product the customer has, even if unsafe',
  ]),
];

class _AvailabilityDay {
  _AvailabilityDay(this.name);

  final String name;
  bool on = true;
  final start = TextEditingController(text: '08:00');
  final end = TextEditingController(text: '18:00');

  void dispose() {
    start.dispose();
    end.dispose();
  }
}

class _OnboardingPageState extends State<OnboardingPage> {
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _bio = TextEditingController();
  final _years = TextEditingController(text: '1');
  final _utr = TextEditingController();
  final _areas = TextEditingController(text: 'B29');
  final _days = [
    for (final name in ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'])
      _AvailabilityDay(name),
  ];
  final _answers = <String, int>{};
  String? _slot;
  String _payout = 'weekly';
  bool _consent = false;
  bool _busy = false;
  String? _status;
  String? _dbs;
  String? _idDoc;
  String? _headshot;
  List<Map<String, dynamic>> _slots = const [];
  final Set<String> _services = {'regular'};

  @override
  void initState() {
    super.initState();
    final profile = widget.session.profile;
    _name.text = profile?.fullName ?? '';
    _phone.text = profile?.phone ?? '';
    _loadSlots();
  }

  Future<void> _loadSlots() async {
    try {
      final body = await MundoriaApi(widget.session).get('/api/cleaner/onboarding');
      final slots = (body as Map)['slots'];
      if (slots is! List || !mounted) return;
      setState(() {
        _slots = slots.map((item) => Map<String, dynamic>.from(item as Map)).toList();
        _slot ??= _slots.isEmpty ? null : '${_slots.first['startsAt']}';
      });
    } catch (error) {
      if (mounted) setState(() => _status = '$error');
    }
  }

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _bio.dispose();
    _years.dispose();
    _utr.dispose();
    _areas.dispose();
    for (final day in _days) {
      day.dispose();
    }
    super.dispose();
  }

  Future<String?> _upload(String kind, String bucket, {bool publicUrl = false}) async {
    final picked = await pickGalleryImage();
    if (picked == null) return null;
    final userId = widget.session.profile?.id;
    if (userId == null) return null;
    final path =
        '$userId/$kind-${DateTime.now().millisecondsSinceEpoch}-${picked.name}';
    return uploadBytes(
      client: widget.session.client,
      bucket: bucket,
      path: path,
      bytes: picked.bytes,
      mime: picked.mime,
      publicUrl: publicUrl,
    );
  }

  Future<void> _submit() async {
    setState(() {
      _busy = true;
      _status = null;
    });
    try {
      if (_dbs == null || _idDoc == null || _headshot == null) {
        throw StateError('Add your DBS, ID, and headshot first.');
      }
      if (_slot == null) throw StateError('Choose an interview time.');
      if (!_consent) throw StateError('Location consent is required.');
      final areas = _areas.text
          .split(',')
          .map((item) => item.trim())
          .where((item) => item.isNotEmpty)
          .toList();
      await MundoriaApi(widget.session).post('/api/cleaner/onboarding', {
        'full_name': _name.text.trim(),
        'phone': _phone.text.trim(),
        'bio': _bio.text.trim(),
        'years_experience': int.tryParse(_years.text.trim()) ?? 0,
        'utr_number': _utr.text.trim(),
        'working_areas': areas,
        'services': _services.toList(),
        'payout_preference': _payout,
        'dbs_document_url': _dbs,
        'id_document_url': _idDoc,
        'headshot_url': _headshot,
        'interview_scheduled_at': _slot,
        'location_tracking_consent_accepted': true,
        'location_tracking_consent_version': 'cleaner-location-consent-v1',
        'skills_exam_answers': _answers,
        'availability': [
          for (var index = 0; index < _days.length; index++)
            {
              'day_of_week': index,
              'start_time': _days[index].start.text.trim(),
              'end_time': _days[index].end.text.trim(),
              'is_available': _days[index].on,
            },
        ],
      });
      if (mounted) setState(() => _status = 'Application sent.');
    } on MundoriaApiException catch (error) {
      if (mounted) setState(() => _status = error.message);
    } catch (error) {
      if (mounted) setState(() => _status = '$error');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Onboarding')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          TextField(controller: _name, decoration: const InputDecoration(labelText: 'Full name')),
          const SizedBox(height: 12),
          TextField(controller: _phone, decoration: const InputDecoration(labelText: 'Phone')),
          const SizedBox(height: 12),
          TextField(
            controller: _bio,
            minLines: 3,
            maxLines: 6,
            decoration: const InputDecoration(labelText: 'Bio (at least 20 characters)'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _years,
            decoration: const InputDecoration(labelText: 'Years of experience'),
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _utr,
            decoration: const InputDecoration(labelText: 'UTR (10 digits)'),
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _areas,
            decoration: const InputDecoration(labelText: 'Working areas, e.g. B29, B17'),
          ),
          const SizedBox(height: 12),
          const Text('Availability', style: TextStyle(fontWeight: FontWeight.w700)),
          for (final day in _days) ...[
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(day.name),
              value: day.on,
              onChanged: (value) => setState(() => day.on = value),
            ),
            if (day.on)
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: day.start,
                      decoration: const InputDecoration(labelText: 'From'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: day.end,
                      decoration: const InputDecoration(labelText: 'Until'),
                    ),
                  ),
                ],
              ),
          ],
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: _payout,
            decoration: const InputDecoration(labelText: 'Payouts'),
            items: const [
              DropdownMenuItem(value: 'weekly', child: Text('Weekly')),
              DropdownMenuItem(value: 'monthly', child: Text('Monthly')),
            ],
            onChanged: (value) => setState(() => _payout = value ?? 'weekly'),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            children: [
              for (final service in ['regular', 'deep_clean', 'one_off', 'end_of_tenancy', 'office'])
                FilterChip(
                  label: Text(serviceLabel(service)),
                  selected: _services.contains(service),
                  onSelected: (selected) => setState(() {
                    if (selected) {
                      _services.add(service);
                    } else {
                      _services.remove(service);
                    }
                  }),
                ),
            ],
          ),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: () async {
              final path = await _upload('dbs', 'cleaner-documents');
              if (path != null) setState(() => _dbs = path);
            },
            child: Text(_dbs == null ? 'Upload DBS' : 'DBS added'),
          ),
          OutlinedButton(
            onPressed: () async {
              final path = await _upload('id', 'cleaner-documents');
              if (path != null) setState(() => _idDoc = path);
            },
            child: Text(_idDoc == null ? 'Upload ID' : 'ID added'),
          ),
          OutlinedButton(
            onPressed: () async {
              final url = await _upload('headshot', 'avatars', publicUrl: true);
              if (url != null) setState(() => _headshot = url);
            },
            child: Text(_headshot == null ? 'Upload headshot' : 'Headshot added'),
          ),
          const SizedBox(height: 12),
          if (_slots.isEmpty)
            const Text('Interview times will appear when you are signed in.')
          else
            DropdownButtonFormField<String>(
              value: _slot,
              decoration: const InputDecoration(labelText: 'Interview'),
              items: [
                for (final slot in _slots)
                  DropdownMenuItem(
                    value: '${slot['startsAt']}',
                    child: Text('${slot['label']}'),
                  ),
              ],
              onChanged: (value) => setState(() => _slot = value),
            ),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('I agree to location sharing for check-in and jobs I am on the way to'),
            value: _consent,
            onChanged: (value) => setState(() => _consent = value),
          ),
          const SizedBox(height: 8),
          const Text('Skills check', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
          for (final question in _exam) ...[
            const SizedBox(height: 12),
            Text(question.prompt),
            for (var index = 0; index < question.options.length; index++)
              RadioListTile<int>(
                contentPadding: EdgeInsets.zero,
                value: index,
                groupValue: _answers[question.id],
                title: Text(question.options[index]),
                onChanged: (value) => setState(() {
                  if (value != null) _answers[question.id] = value;
                }),
              ),
          ],
          const SizedBox(height: 12),
          FilledButton(
            onPressed: _busy ? null : _submit,
            child: Text(_busy ? 'Sending…' : 'Submit application'),
          ),
          if (_status != null) ...[
            const SizedBox(height: 12),
            Text(_status!, style: const TextStyle(height: 1.4)),
          ],
        ],
      ),
    );
  }
}
