import 'package:flutter/material.dart';
import 'package:mundoria_core/mundoria_core.dart';

import 'actions.dart';

class CustomerHome extends StatelessWidget {
  const CustomerHome({
    super.key,
    required this.session,
    required this.profile,
  });

  final MundoriaSession session;
  final MundoriaProfile profile;

  @override
  Widget build(BuildContext context) {
    return VisitLoader(
      title: 'Welcome back, ${profile.firstName}.',
      load: () async {
        final visits = await session.customerVisits();
        return upcomingVisits(visits);
      },
      onVisit: (visit) => openCustomerVisit(context, session, visit),
      header: FilledButton(
        onPressed: () => openBookingQuote(context, session),
        child: const Text('Book a session'),
      ),
    );
  }
}

class CustomerSessions extends StatelessWidget {
  const CustomerSessions({super.key, required this.session});

  final MundoriaSession session;

  @override
  Widget build(BuildContext context) {
    return VisitLoader(
      title: 'Sessions',
      load: () async {
        final visits = await session.customerVisits();
        final upcoming = upcomingVisits(visits);
        final upcomingIds = upcoming.map((visit) => visit.id).toSet();
        final earlier = visits
            .where((visit) => !upcomingIds.contains(visit.id))
            .toList()
          ..sort((a, b) => compareVisits(b, a));
        return [...upcoming, ...earlier];
      },
      empty: 'You have no sessions yet.',
      onVisit: (visit) => openCustomerVisit(context, session, visit),
    );
  }
}

class CustomerMessages extends StatelessWidget {
  const CustomerMessages({super.key, required this.session});

  final MundoriaSession session;

  @override
  Widget build(BuildContext context) {
    return MessageList(
      load: session.messages,
      onMessage: (message) async {
        final visit = await session.visitById(message.bookingId);
        if (!context.mounted || visit == null) return;
        openCustomerVisit(context, session, visit);
      },
    );
  }
}

class VisitLoader extends StatefulWidget {
  const VisitLoader({
    super.key,
    required this.title,
    required this.load,
    this.empty = 'Nothing scheduled yet.',
    this.onVisit,
    this.header,
  });

  final String title;
  final Future<List<Visit>> Function() load;
  final String empty;
  final ValueChanged<Visit>? onVisit;
  final Widget? header;

  @override
  State<VisitLoader> createState() => _VisitLoaderState();
}

class _VisitLoaderState extends State<VisitLoader> {
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
                const Padding(
                  padding: EdgeInsets.only(top: 24),
                  child: Center(child: CircularProgressIndicator()),
                )
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

class MessageList extends StatefulWidget {
  const MessageList({super.key, required this.load, this.onMessage});

  final Future<List<MundoriaMessage>> Function() load;
  final ValueChanged<MundoriaMessage>? onMessage;

  @override
  State<MessageList> createState() => _MessageListState();
}

class _MessageListState extends State<MessageList> {
  late Future<List<MundoriaMessage>> _future;

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
      child: FutureBuilder<List<MundoriaMessage>>(
        future: _future,
        builder: (context, snapshot) {
          final messages = snapshot.data ?? const <MundoriaMessage>[];
          return ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
            children: [
              const Text(
                'Messages',
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
              else if (messages.isEmpty)
                const Text(
                  'No messages yet.',
                  style: TextStyle(color: MundoriaColors.muted),
                )
              else
                for (final message in messages)
                  InkWell(
                    onTap: widget.onMessage == null
                        ? null
                        : () => widget.onMessage!(message),
                    child: Container(
                      width: double.infinity,
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: MundoriaColors.line),
                      ),
                      child: Text(
                        message.content.isEmpty ? 'Photo' : message.content,
                        style: const TextStyle(
                          color: MundoriaColors.ink,
                          height: 1.4,
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
