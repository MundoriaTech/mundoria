import 'labels.dart';

class Visit {
  const Visit({
    required this.id,
    required this.status,
    required this.serviceType,
    required this.date,
    required this.startTime,
    this.amountPence,
    this.city,
    this.postcode,
    this.isRecurring = false,
  });

  final String id;
  final String status;
  final String serviceType;
  final String date;
  final String startTime;
  final int? amountPence;
  final String? city;
  final String? postcode;
  final bool isRecurring;

  bool get isOpen => !closedStatuses.contains(status);

  String get place {
    final bits = <String>[
      if (city != null && city!.trim().isNotEmpty) city!.trim(),
      if (postcode != null && postcode!.trim().isNotEmpty) postcode!.trim(),
    ];
    return bits.join(', ');
  }

  factory Visit.fromRow(Map<String, dynamic> row, {required String amountKey}) {
    final address = row['address'];
    final amount = row[amountKey];
    return Visit(
      id: row['id'] as String,
      status: row['status'] as String? ?? '',
      serviceType: row['service_type'] as String? ?? '',
      date: row['scheduled_date'] as String? ?? '',
      startTime: row['scheduled_start_time'] as String? ?? '',
      amountPence: amount is num ? amount.round() : null,
      city: address is Map ? address['city'] as String? : null,
      postcode: address is Map ? address['postcode'] as String? : null,
      isRecurring: row['is_recurring'] == true,
    );
  }
}

int compareVisits(Visit a, Visit b) {
  final byDate = a.date.compareTo(b.date);
  if (byDate != 0) return byDate;
  return a.startTime.compareTo(b.startTime);
}

List<Visit> upcomingVisits(List<Visit> visits, {String? fromDate}) {
  final start = fromDate ?? todayIso();
  final open = visits.where((visit) {
    return visit.isOpen && visit.date.compareTo(start) >= 0;
  }).toList();
  open.sort(compareVisits);
  return open;
}
