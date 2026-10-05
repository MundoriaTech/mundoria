import 'package:flutter_test/flutter_test.dart';
import 'package:mundoria/main.dart';
import 'package:mundoria_core/mundoria_core.dart';

void main() {
  testWidgets('Mundoria asks for Supabase keys when they are missing', (tester) async {
    final session = MundoriaSession(expectedRole: 'customer');
    await session.start();
    await tester.pumpWidget(MundoriaApp(session: session));
    expect(find.textContaining('SUPABASE_URL'), findsOneWidget);
  });
}
