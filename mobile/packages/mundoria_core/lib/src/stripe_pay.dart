import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:url_launcher/url_launcher.dart';

import 'config.dart';

bool stripeSheetClosed(Object error) => error is StripeException;

Future<void> openExternalUrl(String url) async {
  final uri = Uri.parse(url);
  final opened = await launchUrl(uri, mode: LaunchMode.externalApplication);
  if (!opened) {
    throw StateError('Could not open $url');
  }
}

String paymentIntentIdFromSecret(String clientSecret) {
  const marker = '_secret_';
  final index = clientSecret.indexOf(marker);
  if (index <= 0) {
    throw StateError('The payment reference was missing.');
  }
  return clientSecret.substring(0, index);
}

String? _stringField(Map body, List<String> keys) {
  for (final key in keys) {
    final value = body[key];
    if (value is String && value.isNotEmpty) return value;
  }
  return null;
}

/// Presents the Stripe sheet for an intent the Mundoria API already created.
Future<String> confirmApiPayment(Map body) {
  final secret = _stringField(body, ['clientSecret', 'client_secret']);
  if (secret == null) {
    throw StateError('Payment could not be started.');
  }
  final id = _stringField(body, ['paymentIntentId', 'payment_intent_id']) ??
      paymentIntentIdFromSecret(secret);
  return confirmPaymentIntent(clientSecret: secret, paymentIntentId: id);
}

/// Confirms a Stripe PaymentIntent that the Mundoria API already created.
Future<String> confirmPaymentIntent({
  required String clientSecret,
  required String paymentIntentId,
}) async {
  const key = MundoriaConfig.stripePublishableKey;
  if (key.isEmpty) {
    throw StateError(
      'This build is missing STRIPE_PUBLISHABLE_KEY, so the card hold cannot be confirmed here.',
    );
  }
  Stripe.publishableKey = key;
  await Stripe.instance.applySettings();
  await Stripe.instance.initPaymentSheet(
    paymentSheetParameters: SetupPaymentSheetParameters(
      paymentIntentClientSecret: clientSecret,
      merchantDisplayName: 'Mundoria',
    ),
  );
  await Stripe.instance.presentPaymentSheet();
  return paymentIntentId;
}
