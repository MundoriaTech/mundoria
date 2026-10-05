import 'dart:convert';

import 'package:http/http.dart' as http;

import 'config.dart';
import 'session.dart';

class MundoriaApiException implements Exception {
  MundoriaApiException(this.message);
  final String message;

  @override
  String toString() => message;
}

class MundoriaApi {
  MundoriaApi(this.session);

  final MundoriaSession session;

  Future<dynamic> get(String path) => _send('GET', path);

  Future<dynamic> post(String path, [Map<String, dynamic>? body]) =>
      _send('POST', path, body);

  Future<dynamic> patch(String path, [Map<String, dynamic>? body]) =>
      _send('PATCH', path, body);

  Future<dynamic> delete(String path) => _send('DELETE', path);

  Future<void> signUp({
    required String fullName,
    required String email,
    required String password,
    required String role,
    String? phone,
    String? gender,
    String? referralCode,
  }) async {
    final response = await http.post(
      Uri.parse('${MundoriaConfig.apiBase}/api/auth/signup'),
      headers: const {'content-type': 'application/json'},
      body: jsonEncode({
        'email': email.trim(),
        'full_name': fullName.trim(),
        'password': password,
        'phone': phone?.trim() ?? '',
        'role': role,
        if (gender != null) 'gender': gender,
        if (referralCode != null && referralCode.trim().isNotEmpty)
          'referral_code': referralCode.trim(),
      }),
    );
    _throwIfNeeded(response);
  }

  Future<dynamic> _send(
    String method,
    String path, [
    Map<String, dynamic>? body,
  ]) async {
    final token = session.client.auth.currentSession?.accessToken;
    if (token == null) {
      throw MundoriaApiException('Sign in again.');
    }
    final uri = Uri.parse('${MundoriaConfig.apiBase}$path');
    final headers = {
      'authorization': 'Bearer $token',
      'content-type': 'application/json',
    };
    final encoded = body == null ? null : jsonEncode(body);
    final http.Response response;
    switch (method) {
      case 'GET':
        response = await http.get(uri, headers: headers);
      case 'PATCH':
        response = await http.patch(uri, headers: headers, body: encoded);
      case 'DELETE':
        response = await http.delete(uri, headers: headers);
      default:
        response = await http.post(uri, headers: headers, body: encoded);
    }
    _throwIfNeeded(response);
    if (response.body.isEmpty) return {};
    return jsonDecode(response.body);
  }

  void _throwIfNeeded(http.Response response) {
    if (response.statusCode < 400) return;
    String message = 'Something went wrong.';
    try {
      final decoded = jsonDecode(response.body);
      if (decoded is Map && decoded['error'] is String) {
        message = decoded['error'] as String;
      }
    } catch (_) {
      // Keep the fallback message.
    }
    throw MundoriaApiException(message);
  }
}
