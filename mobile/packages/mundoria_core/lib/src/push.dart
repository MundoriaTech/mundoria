import 'package:onesignal_flutter/onesignal_flutter.dart';

import 'api.dart';
import 'config.dart';
import 'session.dart';

bool _started = false;

/// Registers this device with OneSignal when the app id was baked into the build.
Future<void> registerPush(MundoriaSession session) async {
  const appId = MundoriaConfig.oneSignalAppId;
  if (appId.isEmpty || session.profile == null) return;
  if (!_started) {
    OneSignal.initialize(appId);
    _started = true;
    OneSignal.User.pushSubscription.addObserver((state) {
      final id = state.current.id;
      if (id == null) return;
      _savePlayer(session, id);
    });
  }
  await OneSignal.Notifications.requestPermission(true);
  final current = OneSignal.User.pushSubscription.id;
  if (current != null) await _savePlayer(session, current);
}

Future<void> _savePlayer(MundoriaSession session, String playerId) async {
  if (playerId.length < 8) return;
  try {
    await MundoriaApi(session).post('/api/profile/onesignal', {
      'playerId': playerId,
    });
  } catch (_) {}
}
