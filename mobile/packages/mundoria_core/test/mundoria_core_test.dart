import 'package:flutter_test/flutter_test.dart';
import 'package:mundoria_core/mundoria_core.dart';

void main() {
  test('formats money in pounds and labels a service', () {
    expect(formatPence(4500), '£45.00');
    expect(serviceLabel('deep_clean'), 'Deep Cleaning');
    expect(statusLabel('cleaner_en_route'), 'On the way');
  });

  test('keeps upcoming visits and drops closed ones', () {
    const open = Visit(
      id: '1',
      status: 'confirmed',
      serviceType: 'regular',
      date: '2026-10-06',
      startTime: '09:00:00',
    );
    const done = Visit(
      id: '2',
      status: 'completed',
      serviceType: 'regular',
      date: '2026-10-06',
      startTime: '11:00:00',
    );
    final upcoming = upcomingVisits([done, open], fromDate: '2026-10-05');
    expect(upcoming.map((visit) => visit.id), ['1']);
    expect(formatVisitWhen('2026-10-06', '09:00:00'), '6 Oct · 09:00');
  });
}
