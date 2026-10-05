import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';

import 'config.dart';
import 'messages.dart';
import 'profile.dart';
import 'push.dart';
import 'visit.dart';

class MundoriaSession extends ChangeNotifier {
  MundoriaSession({required this.expectedRole});

  final String expectedRole;

  MundoriaProfile? profile;
  bool ready = false;
  String? configError;
  SupabaseClient? _client;
  StreamSubscription<AuthState>? _authSub;
  bool _signingOut = false;

  SupabaseClient get client {
    final current = _client;
    if (current == null) {
      throw StateError('Supabase is not ready.');
    }
    return current;
  }

  Future<void> start() async {
    if (!MundoriaConfig.isConfigured) {
      configError =
          'This build is missing SUPABASE_URL and SUPABASE_ANON_KEY.';
      ready = true;
      notifyListeners();
      return;
    }

    await Supabase.initialize(
      url: MundoriaConfig.url,
      publishableKey: MundoriaConfig.anonKey,
    );
    _client = Supabase.instance.client;
    _authSub = _client!.auth.onAuthStateChange.listen((state) async {
      final user = state.session?.user;
      if (user == null) {
        profile = null;
        notifyListeners();
        return;
      }
      final loaded = await _loadProfile(user.id);
      if (loaded == null || loaded.role != expectedRole) {
        profile = null;
        if (_signingOut) return;
        _signingOut = true;
        await _client?.auth.signOut();
        _signingOut = false;
        notifyListeners();
        return;
      }
      profile = loaded;
      notifyListeners();
      await registerPush(this);
    });
    ready = true;
    notifyListeners();
  }

  Future<String?> signIn(String email, String password) async {
    try {
      final response = await client.auth.signInWithPassword(
        email: email.trim(),
        password: password,
      );
      final user = response.user;
      if (user == null) {
        return 'Sign-in did not return an account.';
      }
      final loaded = await _loadProfile(user.id);
      if (loaded == null) {
        await client.auth.signOut();
        return 'Your account profile could not be loaded.';
      }
      if (loaded.role != expectedRole) {
        await client.auth.signOut();
        return expectedRole == 'cleaner'
            ? 'This account is a customer. Open the Mundoria app.'
            : 'This account is a cleaner. Open Mundoria Pro.';
      }
      profile = loaded;
      notifyListeners();
      await registerPush(this);
      return null;
    } on AuthException catch (error) {
      return error.message;
    }
  }

  Future<void> signOut() => client.auth.signOut();

  Future<List<Visit>> customerVisits() {
    return _visits(column: 'customer_id', amountKey: 'amount_total');
  }

  Future<List<Visit>> cleanerVisits() async {
    final token = client.auth.currentSession?.accessToken;
    if (token == null) return const [];
    final response = await http.get(
      Uri.parse('${MundoriaConfig.apiBase}/api/cleaner/jobs'),
      headers: {'authorization': 'Bearer $token'},
    );
    if (response.statusCode >= 400) {
      throw StateError('Could not load jobs.');
    }
    final body = jsonDecode(response.body);
    final jobs = body is Map ? body['jobs'] : null;
    if (jobs is! List) return const [];
    return jobs
        .map(
          (row) => Visit.fromRow(
            Map<String, dynamic>.from(row as Map),
            amountKey: 'amount_cleaner',
          ),
        )
        .toList();
  }

  Future<void> reloadProfile() async {
    final userId = client.auth.currentUser?.id;
    if (userId == null) return;
    profile = await _loadProfile(userId);
    notifyListeners();
  }

  Future<Visit?> visitById(String id) async {
    final row = await client
        .from('bookings')
        .select(
          'id, status, service_type, scheduled_date, scheduled_start_time, is_recurring, amount_total, amount_cleaner, address:addresses(city, postcode)',
        )
        .eq('id', id)
        .maybeSingle();
    if (row == null) return null;
    final amountKey =
        expectedRole == 'cleaner' ? 'amount_cleaner' : 'amount_total';
    return Visit.fromRow(row, amountKey: amountKey);
  }

  Future<List<MundoriaMessage>> bookingMessages(String bookingId) async {
    final userId = profile?.id;
    if (userId == null) return const [];
    final rows = await client
        .from('messages')
        .select(
          'id, booking_id, content, created_at, sender_id, is_read, attachments',
        )
        .eq('booking_id', bookingId)
        .order('created_at');
    return rows
        .map((row) => MundoriaMessage.fromRow(row, userId))
        .toList();
  }

  Future<List<MundoriaMessage>> messages() async {
    final userId = profile?.id;
    if (userId == null) return const [];
    final rows = await client
        .from('messages')
        .select(
          'id, booking_id, content, created_at, sender_id, is_read, attachments',
        )
        .or('sender_id.eq.$userId,receiver_id.eq.$userId')
        .order('created_at', ascending: false)
        .limit(40);
    return rows
        .map((row) => MundoriaMessage.fromRow(row, userId))
        .toList();
  }

  Future<List<Visit>> _visits({
    required String column,
    required String amountKey,
  }) async {
    final userId = profile?.id;
    if (userId == null) return const [];
    final rows = await client
        .from('bookings')
        .select(
          'id, status, service_type, scheduled_date, scheduled_start_time, is_recurring, amount_total, amount_cleaner, address:addresses(city, postcode)',
        )
        .eq(column, userId)
        .order('scheduled_date')
        .order('scheduled_start_time');
    return rows
        .map((row) => Visit.fromRow(row, amountKey: amountKey))
        .toList();
  }

  Future<MundoriaProfile?> _loadProfile(String userId) async {
    final row = await client
        .from('profiles')
        .select(
          'id, full_name, email, role, avatar_url, phone, referral_code, notification_preferences',
        )
        .eq('id', userId)
        .maybeSingle();
    if (row == null) return null;
    return MundoriaProfile.fromRow(row);
  }

  @override
  void dispose() {
    _authSub?.cancel();
    super.dispose();
  }
}
