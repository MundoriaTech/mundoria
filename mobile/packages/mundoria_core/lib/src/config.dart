class MundoriaConfig {
  static const url = String.fromEnvironment('SUPABASE_URL');
  static const anonKey = String.fromEnvironment('SUPABASE_ANON_KEY');
  static const apiBase = String.fromEnvironment(
    'API_BASE',
    defaultValue: 'http://127.0.0.1:3000',
  );
  static const stripePublishableKey = String.fromEnvironment(
    'STRIPE_PUBLISHABLE_KEY',
  );
  static const oneSignalAppId = String.fromEnvironment('ONESIGNAL_APP_ID');

  static bool get isConfigured => url.isNotEmpty && anonKey.isNotEmpty;
}
