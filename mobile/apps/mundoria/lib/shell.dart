import 'package:flutter/material.dart';
import 'package:mundoria_core/mundoria_core.dart';

import 'actions.dart';
import 'customer_flow.dart';
import 'pages.dart';

class CustomerShell extends StatefulWidget {
  const CustomerShell({
    super.key,
    required this.session,
    required this.profile,
  });

  final MundoriaSession session;
  final MundoriaProfile profile;

  @override
  State<CustomerShell> createState() => _CustomerShellState();
}

class _CustomerShellState extends State<CustomerShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final pages = [
      CustomerHome(session: widget.session, profile: widget.profile),
      CustomerSessions(session: widget.session),
      CustomerMessages(session: widget.session),
      MundoriaAccountPage(
        profile: widget.profile,
        appName: 'Mundoria',
        onSignOut: widget.session.signOut,
        actions: [
          OutlinedButton(
            onPressed: () => openProfileEditor(context, widget.session),
            child: const Text('Edit profile'),
          ),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: () => openAddresses(context, widget.session),
            child: const Text('Addresses'),
          ),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: () => openPayments(context, widget.session),
            child: const Text('Payments & receipts'),
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
            icon: Icon(Icons.calendar_today_outlined),
            label: 'Sessions',
          ),
          NavigationDestination(
            icon: Icon(Icons.chat_bubble_outline),
            label: 'Messages',
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
