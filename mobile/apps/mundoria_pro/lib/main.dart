import 'package:flutter/material.dart';
import 'package:mundoria_core/mundoria_core.dart';

import 'shell.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final session = MundoriaSession(expectedRole: 'cleaner');
  await session.start();
  runApp(MundoriaProApp(session: session));
}

class MundoriaProApp extends StatelessWidget {
  const MundoriaProApp({super.key, required this.session});

  final MundoriaSession session;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Mundoria Pro',
      theme: mundoriaTheme(),
      home: Builder(
        builder: (context) => MundoriaGate(
          session: session,
          title: 'Mundoria Pro',
          subtitle: 'Sign in to see your jobs, diary, and earnings.',
          onCreateAccount: () {
            Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => SignUpPage(session: session, role: 'cleaner'),
              ),
            );
          },
          onForgotPassword: () {
            Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => ForgotPasswordPage(session: session),
              ),
            );
          },
          home: (profile) => CleanerShell(session: session, profile: profile),
        ),
      ),
    );
  }
}
