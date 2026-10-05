import 'package:flutter/material.dart';

import '../api.dart';
import '../media.dart';
import '../messages.dart';
import '../session.dart';
import '../theme.dart';

class BookingThread extends StatefulWidget {
  const BookingThread({
    super.key,
    required this.session,
    required this.bookingId,
  });

  final MundoriaSession session;
  final String bookingId;

  @override
  State<BookingThread> createState() => _BookingThreadState();
}

class _BookingThreadState extends State<BookingThread> {
  final _message = TextEditingController();
  late Future<List<MundoriaMessage>> _future;
  String? _status;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _future = widget.session.bookingMessages(widget.bookingId);
  }

  @override
  void dispose() {
    _message.dispose();
    super.dispose();
  }

  Future<void> _send({List<Map<String, dynamic>>? attachments}) async {
    final content = _message.text.trim();
    if (content.isEmpty && (attachments == null || attachments.isEmpty)) return;
    setState(() {
      _busy = true;
      _status = null;
    });
    try {
      await MundoriaApi(widget.session).post('/api/messages', {
        'bookingId': widget.bookingId,
        'content': content,
        if (attachments != null) 'attachments': attachments,
      });
      _message.clear();
      setState(() => _future = widget.session.bookingMessages(widget.bookingId));
    } on MundoriaApiException catch (error) {
      setState(() => _status = error.message);
    } catch (error) {
      setState(() => _status = '$error');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _attach() async {
    final picked = await pickGalleryImage();
    if (picked == null) return;
    final userId = widget.session.profile?.id;
    if (userId == null) return;
    setState(() => _busy = true);
    try {
      final path =
          '$userId/${widget.bookingId}-${DateTime.now().millisecondsSinceEpoch}-${picked.name}';
      final url = await uploadBytes(
        client: widget.session.client,
        bucket: 'message-media',
        path: path,
        bytes: picked.bytes,
        mime: picked.mime,
        publicUrl: true,
      );
      await _send(attachments: [
        {
          'url': url,
          'type': 'image',
          'mime': picked.mime,
          'name': picked.name,
        },
      ]);
    } catch (error) {
      if (mounted) setState(() => _status = '$error');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Messages',
          style: TextStyle(
            color: MundoriaColors.ink,
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 8),
        FutureBuilder<List<MundoriaMessage>>(
          future: _future,
          builder: (context, snapshot) {
            final messages = snapshot.data ?? const <MundoriaMessage>[];
            if (snapshot.hasError) {
              return Text(
                '${snapshot.error}',
                style: const TextStyle(color: MundoriaColors.orange),
              );
            }
            if (messages.isEmpty) {
              return const Text(
                'No messages on this visit yet.',
                style: TextStyle(color: MundoriaColors.muted),
              );
            }
            return Column(
              children: [
                for (final message in messages)
                  Align(
                    alignment: message.mine
                        ? Alignment.centerRight
                        : Alignment.centerLeft,
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      constraints: const BoxConstraints(maxWidth: 280),
                      decoration: BoxDecoration(
                        color: message.mine
                            ? const Color(0xFFE7E4F6)
                            : Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: MundoriaColors.line),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (message.content.isNotEmpty)
                            Text(
                              message.content,
                              style: const TextStyle(color: MundoriaColors.ink),
                            ),
                          for (final url in message.imageUrls) ...[
                            if (message.content.isNotEmpty)
                              const SizedBox(height: 6),
                            Image.network(
                              url,
                              width: 180,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => const Text('Photo'),
                            ),
                          ],
                          if (message.content.isEmpty && message.imageUrls.isEmpty)
                            const Text(
                              'Photo',
                              style: TextStyle(color: MundoriaColors.ink),
                            ),
                        ],
                      ),
                    ),
                  ),
              ],
            );
          },
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _message,
          minLines: 2,
          maxLines: 4,
          decoration: const InputDecoration(labelText: 'Message'),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: FilledButton(
                onPressed: _busy ? null : () => _send(),
                child: const Text('Send'),
              ),
            ),
            const SizedBox(width: 8),
            OutlinedButton(
              onPressed: _busy ? null : _attach,
              child: const Text('Photo'),
            ),
          ],
        ),
        if (_status != null) ...[
          const SizedBox(height: 8),
          Text(_status!, style: const TextStyle(color: MundoriaColors.orange)),
        ],
      ],
    );
  }
}
