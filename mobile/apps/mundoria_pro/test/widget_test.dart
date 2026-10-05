import 'package:flutter_test/flutter_test.dart';
import 'package:mundoria_core/mundoria_core.dart';
import 'package:mundoria_pro/main.dart';

void main() {
  testWidgets('Mundoria Pro asks for Supabase keys when they are missing', (tester) async {
    final session = MundoriaSession(expectedRole: 'cleaner');
    await session.start();
    await tester.pumpWidget(MundoriaProApp(session: session));
    expect(find.textContaining('SUPABASE_URL'), findsOneWidget);
  });
}
