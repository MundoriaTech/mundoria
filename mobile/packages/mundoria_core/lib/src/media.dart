import 'dart:typed_data';

import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class PickedMedia {
  const PickedMedia({
    required this.bytes,
    required this.name,
    required this.mime,
  });

  final Uint8List bytes;
  final String name;
  final String mime;
}

Future<PickedMedia?> pickGalleryImage() async {
  final file = await ImagePicker().pickImage(
    source: ImageSource.gallery,
    imageQuality: 82,
  );
  if (file == null) return null;
  final name = file.name.replaceAll(RegExp(r'[^a-zA-Z0-9._-]+'), '-');
  return PickedMedia(
    bytes: await file.readAsBytes(),
    name: name.isEmpty ? 'photo.jpg' : name,
    mime: 'image/jpeg',
  );
}

Future<String> uploadBytes({
  required SupabaseClient client,
  required String bucket,
  required String path,
  required Uint8List bytes,
  required String mime,
  bool publicUrl = false,
}) async {
  await client.storage.from(bucket).uploadBinary(
        path,
        bytes,
        fileOptions: FileOptions(contentType: mime, upsert: false),
      );
  if (!publicUrl) return path;
  return client.storage.from(bucket).getPublicUrl(path);
}
