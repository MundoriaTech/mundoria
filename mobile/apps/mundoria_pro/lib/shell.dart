import 'package:flutter/material.dart';
import 'package:mundoria_core/mundoria_core.dart';

import 'pages.dart';
import 'pro_flow.dart';

class CleanerShell extends StatefulWidget {
  const CleanerShell({
    super.key,
    required this.session,
    required this.profile,
  });

  final MundoriaSession session;
  final MundoriaProfile profile;

  @override
  State<CleanerShell> createState() => _CleanerShellState();
}

class _CleanerShellState extends State<CleanerShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final pages = [
      CleanerHome(session: widget.session, profile: widget.profile),
      CleanerJobs(session: widget.session),
      CleanerDiary(session: widget.session),
      CleanerEarnings(session: widget.session),
      MundoriaAccountPage(
        profile: widget.profile,
        appName: 'Mundoria Pro',
        onSignOut: widget.session.signOut,
        actions: [
          OutlinedButton(
            onPressed: () => openCleanerInbox(context, widget.session),
            child: const Text('Messages'),
          ),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: () => openOnboarding(context, widget.session),
            child: const Text('Onboarding'),
          ),
          const SizedBox(height: 12),
        ],
      ),
    ];
    return Scaffold(
      body: SafeArea(child: pages[_index]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (index) => setState(() => _index = index),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), label: 'Home'),
          NavigationDestination(
            icon: Icon(Icons.work_outline),
            label: 'Jobs',
          ),
          NavigationDestination(
            icon: Icon(Icons.calendar_month_outlined),
            label: 'Diary',
          ),
          NavigationDestination(
            icon: Icon(Icons.payments_outlined),
            label: 'Earnings',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            label: 'Account',
          ),
        ],
      ),
    );
  }
}
