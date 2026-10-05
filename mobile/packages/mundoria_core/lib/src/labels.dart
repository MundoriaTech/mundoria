const _months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const _services = {
  'regular': 'Regular Cleaning',
  'one_off': 'One-Off Cleaning',
  'same_day': 'Same-Day Cleaning',
  'deep_clean': 'Deep Cleaning',
  'end_of_tenancy': 'End of Tenancy Cleaning',
  'move_in': 'Move-in / move-out cleaning',
  'move_out': 'Move-Out Cleaning',
  'airbnb_turnover': 'Airbnb/Shortlet Cleaning',
  'holiday_let': 'Holiday Let Cleaning',
  'serviced_accommodation': 'Serviced Accommodation Cleaning',
  'office': 'Office Cleaning',
  'retail_hospitality': 'Retail & Hospitality Cleaning',
  'educational_facility': 'Educational Facility Cleaning',
  'communal_area': 'Communal Area Cleaning',
  'window_cleaning': 'Window Cleaning',
  'pregnancy_support': 'Pregnancy & postpartum cleaning',
  'postpartum': 'Postpartum Cleaning',
  'illness_recovery': 'Illness & injury recovery',
  'post_injury': 'Injury Recovery Cleaning',
  'hospital_discharge': 'Hospital Discharge Home Cleaning',
  'bereavement_support': 'Bereavement Support Cleaning',
};

const _statuses = {
  'pending_match': 'Finding a cleaner',
  'matched': 'Cleaner offered',
  'confirmed': 'Confirmed',
  'cleaner_en_route': 'On the way',
  'in_progress': 'In progress',
  'awaiting_customer_confirmation': 'Awaiting confirmation',
  'completed': 'Completed',
  'cancelled': 'Cancelled',
  'no_show': 'No show',
  'disputed': 'Disputed',
};

const closedStatuses = {'completed', 'cancelled', 'no_show'};

String serviceLabel(String value) {
  return _services[value] ?? value.replaceAll('_', ' ');
}

String statusLabel(String value) {
  return _statuses[value] ?? value.replaceAll('_', ' ');
}

String formatPence(int? pence) {
  final pounds = (pence ?? 0) / 100;
  return '£${pounds.toStringAsFixed(2)}';
}

String formatVisitWhen(String date, String time) {
  final parts = date.split('-');
  final clock = time.length >= 5 ? time.substring(0, 5) : time;
  if (parts.length != 3) return '$date $clock'.trim();
  final month = int.tryParse(parts[1]) ?? 1;
  final day = int.tryParse(parts[2]) ?? 1;
  final name = _months[(month - 1).clamp(0, 11)];
  return '$day $name · $clock';
}

String todayIso([DateTime? now]) {
  final value = now ?? DateTime.now();
  final month = value.month.toString().padLeft(2, '0');
  final day = value.day.toString().padLeft(2, '0');
  return '${value.year}-$month-$day';
}
