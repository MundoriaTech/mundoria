import 'package:flutter/material.dart';

import '../api.dart';
import '../session.dart';
import '../theme.dart';

class SignUpPage extends StatefulWidget {
  const SignUpPage({super.key, required this.session, required this.role});

  final MundoriaSession session;
  final String role;

  @override
  State<SignUpPage> createState() => _SignUpPageState();
}

class _SignUpPageState extends State<SignUpPage> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _phone = TextEditingController();
  final _referral = TextEditingController();
  String _gender = 'woman';
  String? _message;
  bool _busy = false;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    _phone.dispose();
    _referral.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _busy = true;
      _message = null;
    });
    try {
      await MundoriaApi(widget.session).signUp(
        fullName: _name.text,
        email: _email.text,
        password: _password.text,
        role: widget.role,
        phone: _phone.text,
        gender: widget.role == 'cleaner' ? _gender : null,
        referralCode: _referral.text,
      );
      setState(() => _message = 'Check your email to confirm the account, then sign in.');
    } on MundoriaApiException catch (error) {
      setState(() => _message = error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.role == 'cleaner' ? 'Join Mundoria Pro' : 'Create your Mundoria account';
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          TextField(controller: _name, decoration: const InputDecoration(labelText: 'Full name')),
          const SizedBox(height: 12),
          TextField(controller: _email, decoration: const InputDecoration(labelText: 'Email')),
          const SizedBox(height: 12),
          TextField(
            controller: _password,
            obscureText: true,
            decoration: const InputDecoration(labelText: 'Password'),
          ),
          const SizedBox(height: 12),
          TextField(controller: _phone, decoration: const InputDecoration(labelText: 'Phone')),
          const SizedBox(height: 12),
          TextField(
            controller: _referral,
            decoration: const InputDecoration(labelText: 'Referral code'),
          ),
          if (widget.role == 'cleaner') ...[
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _gender,
              decoration: const InputDecoration(labelText: 'Gender'),
              items: const [
                DropdownMenuItem(value: 'woman', child: Text('Woman')),
                DropdownMenuItem(value: 'man', child: Text('Man')),
              ],
              onChanged: (value) => setState(() => _gender = value ?? 'woman'),
            ),
          ],
          if (_message != null) ...[
            const SizedBox(height: 12),
            Text(_message!, style: const TextStyle(color: MundoriaColors.ink, height: 1.4)),
          ],
          const SizedBox(height: 16),
          FilledButton(onPressed: _busy ? null : _submit, child: const Text('Create account')),
        ],
      ),
    );
  }
}

class ForgotPasswordPage extends StatefulWidget {
  const ForgotPasswordPage({super.key, required this.session});

  final MundoriaSession session;

  @override
  State<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends State<ForgotPasswordPage> {
  final _email = TextEditingController();
  String? _message;
  bool _busy = false;

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    setState(() {
      _busy = true;
      _message = null;
    });
    try {
      await widget.session.client.auth.resetPasswordForEmail(_email.text.trim());
      setState(() => _message = 'If that email has an account, a reset link is on its way.');
    } catch (error) {
      setState(() => _message = '$error');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Reset password')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          TextField(controller: _email, decoration: const InputDecoration(labelText: 'Email')),
          if (_message != null) ...[
            const SizedBox(height: 12),
            Text(_message!, style: const TextStyle(height: 1.4)),
          ],
          const SizedBox(height: 16),
          FilledButton(onPressed: _busy ? null : _send, child: const Text('Send reset link')),
        ],
      ),
    );
  }
}
