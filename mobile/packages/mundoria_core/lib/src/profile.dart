class MundoriaProfile {
  const MundoriaProfile({
    required this.id,
    required this.fullName,
    required this.email,
    required this.role,
    this.avatarUrl,
    this.phone,
    this.referralCode,
    this.emailNotifications = true,
    this.pushNotifications = true,
    this.smsNotifications = false,
  });

  final String id;
  final String fullName;
  final String email;
  final String role;
  final String? avatarUrl;
  final String? phone;
  final String? referralCode;
  final bool emailNotifications;
  final bool pushNotifications;
  final bool smsNotifications;

  String get firstName {
    final trimmed = fullName.trim();
    if (trimmed.isEmpty) return 'there';
    return trimmed.split(RegExp(r'\s+')).first;
  }

  factory MundoriaProfile.fromRow(Map<String, dynamic> row) {
    return MundoriaProfile(
      id: row['id'] as String,
      fullName: row['full_name'] as String? ?? '',
      email: row['email'] as String? ?? '',
      role: row['role'] as String? ?? '',
      avatarUrl: row['avatar_url'] as String?,
      phone: row['phone'] as String?,
      referralCode: row['referral_code'] as String?,
      emailNotifications: _pref(row['notification_preferences'], 'email', true),
      pushNotifications: _pref(row['notification_preferences'], 'push', true),
      smsNotifications: _pref(row['notification_preferences'], 'sms', false),
    );
  }
}

bool _pref(Object? raw, String key, bool fallback) {
  if (raw is! Map || !raw.containsKey(key)) return fallback;
  return raw[key] == true;
}
