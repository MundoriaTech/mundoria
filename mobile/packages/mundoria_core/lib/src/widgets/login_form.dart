import 'package:flutter/material.dart';

import '../theme.dart';

class MundoriaLoginForm extends StatefulWidget {
  const MundoriaLoginForm({
    super.key,
    required this.title,
    required this.subtitle,
    required this.onSubmit,
    this.onCreateAccount,
    this.onForgotPassword,
  });

  final String title;
  final String subtitle;
  final Future<String?> Function(String email, String password) onSubmit;
  final VoidCallback? onCreateAccount;
  final VoidCallback? onForgotPassword;

  @override
  State<MundoriaLoginForm> createState() => _MundoriaLoginFormState();
}

class _MundoriaLoginFormState extends State<MundoriaLoginForm> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  String? _error;
  bool _busy = false;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    final error = await widget.onSubmit(_email.text, _password.text);
    if (!mounted) return;
    setState(() {
      _busy = false;
      _error = error;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.title,
                    style: const TextStyle(
                      color: MundoriaColors.ink,
                      fontSize: 36,
                      fontWeight: FontWeight.w700,
                      letterSpacing: -1,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    widget.subtitle,
                    style: const TextStyle(
                      color: MundoriaColors.muted,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 28),
                  TextField(
                    controller: _email,
                    keyboardType: TextInputType.emailAddress,
                    autocorrect: false,
                    textInputAction: TextInputAction.next,
                    decoration: const InputDecoration(labelText: 'Email'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _password,
                    obscureText: true,
                    onSubmitted: (_) => _busy ? null : _submit(),
                    decoration: const InputDecoration(labelText: 'Password'),
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 12),
                    Text(
                      _error!,
                      style: const TextStyle(color: MundoriaColors.orange),
                    ),
                  ],
                  const SizedBox(height: 20),
                  FilledButton(
                    onPressed: _busy ? null : _submit,
                    child: Text(_busy ? 'Signing in…' : 'Sign in'),
                  ),
                  if (widget.onForgotPassword != null ||
                      widget.onCreateAccount != null) ...[
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        if (widget.onForgotPassword != null)
                          TextButton(
                            onPressed: widget.onForgotPassword,
                            child: const Text('Forgot password'),
                          ),
                        const Spacer(),
                        if (widget.onCreateAccount != null)
                          TextButton(
                            onPressed: widget.onCreateAccount,
                            child: const Text('Create account'),
                          ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
