class MundoriaMessage {
  const MundoriaMessage({
    required this.id,
    required this.bookingId,
    required this.content,
    required this.createdAt,
    required this.mine,
    required this.isRead,
    this.imageUrls = const [],
  });

  final String id;
  final String bookingId;
  final String content;
  final DateTime createdAt;
  final bool mine;
  final bool isRead;
  final List<String> imageUrls;

  factory MundoriaMessage.fromRow(Map<String, dynamic> row, String userId) {
    return MundoriaMessage(
      id: row['id'] as String,
      bookingId: row['booking_id'] as String? ?? '',
      content: row['content'] as String? ?? '',
      createdAt: DateTime.tryParse(row['created_at'] as String? ?? '') ??
          DateTime.fromMillisecondsSinceEpoch(0),
      mine: row['sender_id'] == userId,
      isRead: row['is_read'] == true,
      imageUrls: _imageUrls(row['attachments']),
    );
  }
}

List<String> _imageUrls(Object? raw) {
  if (raw is! List) return const [];
  return [
    for (final item in raw)
      if (item is Map && item['type'] == 'image' && item['url'] is String)
        item['url'] as String,
  ];
}
