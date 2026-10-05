import 'package:geolocator/geolocator.dart';

class MundoriaPlace {
  const MundoriaPlace({required this.latitude, required this.longitude});

  final double latitude;
  final double longitude;
}

Future<MundoriaPlace> currentPlace() async {
  final enabled = await Geolocator.isLocationServiceEnabled();
  if (!enabled) {
    throw StateError('Turn on location to check in and share that you are on the way.');
  }
  var permission = await Geolocator.checkPermission();
  if (permission == LocationPermission.denied) {
    permission = await Geolocator.requestPermission();
  }
  if (permission == LocationPermission.denied ||
      permission == LocationPermission.deniedForever) {
    throw StateError('Location permission is needed for this job.');
  }
  final position = await Geolocator.getCurrentPosition();
  return MundoriaPlace(
    latitude: position.latitude,
    longitude: position.longitude,
  );
}
