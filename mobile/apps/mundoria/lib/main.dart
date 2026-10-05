import 'package:flutter/material.dart';
import 'package:mundoria_core/mundoria_core.dart';

import 'actions.dart';
import 'shell.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final session = MundoriaSession(expectedRole: 'customer');
  await session.start();
  runApp(MundoriaApp(session: session));
}

class MundoriaApp extends StatelessWidget {
  const MundoriaApp({super.key, required this.session});

  final MundoriaSession session;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Mundoria',
      theme: mundoriaTheme(),
      home: Builder(
        builder: (context) => MundoriaGate(
          session: session,
          title: 'Mundoria',
          subtitle: 'Sign in to see your sessions and messages.',
          onCreateAccount: () => openSignUp(context, session, 'customer'),
          onForgotPassword: () => openForgotPassword(context, session),
          home: (profile) => CustomerShell(session: session, profile: profile),
        ),
      ),
    );
  }
}
