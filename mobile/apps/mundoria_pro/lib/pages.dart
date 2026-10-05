import 'package:flutter/material.dart';
import 'package:mundoria_core/mundoria_core.dart';

import 'job_page.dart';
import 'pro_flow.dart';

class CleanerHome extends StatelessWidget {
  const CleanerHome({
    super.key,
    required this.session,
    required this.profile,
  });

  final MundoriaSession session;
  final MundoriaProfile profile;

  @override
  Widget build(BuildContext context) {
    return _JobLoader(
      title: 'Welcome back, ${profile.firstName}.',
      load: () async {
        final jobs = await session.cleanerVisits();
        final today = todayIso();
        final todayJobs =
            upcomingVisits(jobs, fromDate: today).where((job) => job.date == today);
        final next = upcomingVisits(jobs);
        final shown = todayJobs.isEmpty ? next.take(1) : todayJobs;
        return shown.toList();
      },
      empty: 'Nothing on the schedule.',
      onVisit: (visit) => openCleanerJob(context, session, visit),
      header: OffersPanel(session: session),
    );
  }
}

class CleanerJobs extends StatelessWidget {
  const CleanerJobs({super.key, required this.session});

  final MundoriaSession session;

  @override
  Widget build(BuildContext context) {
    return _JobLoader(
      title: 'Jobs',
      load: () async => upcomingVisits(await session.cleanerVisits()),
      empty: 'No open jobs.',
      onVisit: (visit) => openCleanerJob(context, session, visit),
    );
  }
}

class CleanerDiary extends StatelessWidget {
  const CleanerDiary({super.key, required this.session});

  final MundoriaSession session;

  @override
  Widget build(BuildContext context) {
    return DiaryBoard(session: session);
  }
}

class CleanerEarnings extends StatefulWidget {
  const CleanerEarnings({super.key, required this.session});

  final MundoriaSession session;

  @override
  State<CleanerEarnings> createState() => _CleanerEarningsState();
}

class _CleanerEarningsState extends State<CleanerEarnings> {
  late Future<List<Visit>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.session.cleanerVisits();
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () async {
        setState(() => _future = widget.session.cleanerVisits());
        await _future;
      },
      child: FutureBuilder<List<Visit>>(
        future: _future,
        builder: (context, snapshot) {
          final jobs = snapshot.data ?? const <Visit>[];
          final now = DateTime.now();
          final monthPrefix =
              '${now.year}-${now.month.toString().padLeft(2, '0')}';
          final weekStart = todayIso(now.subtract(const Duration(days: 6)));
          final completed = jobs.where((job) => job.status == 'completed');
          final month = completed
              .where((job) => job.date.startsWith(monthPrefix))
              .fold<int>(0, (sum, job) => sum + (job.amountPence ?? 0));
          final week = completed
              .where((job) => job.date.compareTo(weekStart) >= 0)
              .fold<int>(0, (sum, job) => sum + (job.amountPence ?? 0));
          return ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
            children: [
              const Text(
                'Earnings',
                style: TextStyle(
                  color: MundoriaColors.ink,
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.6,
                ),
              ),
              const SizedBox(height: 16),
              if (snapshot.connectionState != ConnectionState.done)
                const Center(child: CircularProgressIndicator())
              else if (snapshot.hasError)
                Text(
                  '${snapshot.error}',
                  style: const TextStyle(color: MundoriaColors.orange),
                )
              else ...[
                _EarningTile(label: 'This week', value: formatPence(week)),
                _EarningTile(label: 'This month', value: formatPence(month)),
                PerformancePanel(session: widget.session),
                PayoutActions(session: widget.session),
              ],
            ],
          );
        },
      ),
    );
  }
}

class _EarningTile extends StatelessWidget {
  const _EarningTile({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
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
          Text(label, style: const TextStyle(color: MundoriaColors.muted)),
          const SizedBox(height: 6),
          Text(
            value,
            style: const TextStyle(
              color: MundoriaColors.ink,
              fontSize: 28,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _JobLoader extends StatefulWidget {
  const _JobLoader({
    required this.title,
    required this.load,
    required this.empty,
    this.onVisit,
    this.header,
  });

  final String title;
  final Future<List<Visit>> Function() load;
  final String empty;
  final ValueChanged<Visit>? onVisit;
  final Widget? header;

  @override
  State<_JobLoader> createState() => _JobLoaderState();
}

class _JobLoaderState extends State<_JobLoader> {
  late Future<List<Visit>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.load();
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () async {
        setState(() => _future = widget.load());
        await _future;
      },
      child: FutureBuilder<List<Visit>>(
        future: _future,
        builder: (context, snapshot) {
          return ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
            children: [
              Text(
                widget.title,
                style: const TextStyle(
                  color: MundoriaColors.ink,
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.6,
                ),
              ),
              const SizedBox(height: 16),
              if (widget.header != null) ...[
                widget.header!,
                const SizedBox(height: 16),
              ],
              if (snapshot.connectionState != ConnectionState.done)
                const Center(child: CircularProgressIndicator())
              else if (snapshot.hasError)
                Text(
                  '${snapshot.error}',
                  style: const TextStyle(color: MundoriaColors.orange),
                )
              else
                VisitList(
                  visits: snapshot.data ?? const [],
                  empty: widget.empty,
                  showAmount: true,
                  onVisit: widget.onVisit,
                ),
            ],
          );
        },
      ),
    );
  }
}
