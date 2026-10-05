import 'package:flutter/material.dart';

import '../profile.dart';
import '../session.dart';
import '../theme.dart';
import 'login_form.dart';

class MundoriaGate extends StatelessWidget {
  const MundoriaGate({
    super.key,
    required this.session,
    required this.title,
    required this.subtitle,
    required this.home,
    this.onCreateAccount,
    this.onForgotPassword,
  });

  final MundoriaSession session;
  final String title;
  final String subtitle;
  final Widget Function(MundoriaProfile profile) home;
  final VoidCallback? onCreateAccount;
  final VoidCallback? onForgotPassword;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: session,
      builder: (context, _) {
        if (!session.ready) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        final configError = session.configError;
        if (configError != null) {
          return Scaffold(
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  configError,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: MundoriaColors.ink, height: 1.4),
                ),
              ),
            ),
          );
        }
        final profile = session.profile;
        if (profile == null) {
          return MundoriaLoginForm(
            title: title,
            subtitle: subtitle,
            onSubmit: session.signIn,
            onCreateAccount: onCreateAccount,
            onForgotPassword: onForgotPassword,
          );
        }
        return home(profile);
      },
    );
  }
}
