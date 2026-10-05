import 'package:flutter/material.dart';

import '../profile.dart';
import '../theme.dart';

class MundoriaAccountPage extends StatelessWidget {
  const MundoriaAccountPage({
    super.key,
    required this.profile,
    required this.appName,
    required this.onSignOut,
    this.actions = const [],
  });

  final MundoriaProfile profile;
  final String appName;
  final Future<void> Function() onSignOut;
  final List<Widget> actions;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
      children: [
        Text(
          profile.fullName,
          style: const TextStyle(
            color: MundoriaColors.ink,
            fontSize: 28,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.6,
          ),
        ),
        const SizedBox(height: 6),
        Text(profile.email, style: const TextStyle(color: MundoriaColors.muted)),
        const SizedBox(height: 6),
        Text(appName, style: const TextStyle(color: MundoriaColors.muted)),
        const SizedBox(height: 24),
        ...actions,
        OutlinedButton(
          onPressed: onSignOut,
          style: OutlinedButton.styleFrom(
            foregroundColor: MundoriaColors.ink,
            minimumSize: const Size.fromHeight(48),
            shape: const StadiumBorder(),
            side: const BorderSide(color: MundoriaColors.line),
          ),
          child: const Text('Log out'),
        ),
      ],
    );
  }
}
