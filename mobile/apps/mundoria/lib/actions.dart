import 'package:flutter/material.dart';
import 'package:mundoria_core/mundoria_core.dart';

import 'customer_flow.dart';

void openCustomerVisit(BuildContext context, MundoriaSession session, Visit visit) {
  Navigator.of(context).push(
    MaterialPageRoute<void>(
      builder: (_) => CustomerVisitPage(session: session, visit: visit),
    ),
  );
}

void openBookingQuote(BuildContext context, MundoriaSession session) {
  Navigator.of(context).push(
    MaterialPageRoute<void>(
      builder: (_) => BookingQuotePage(session: session),
    ),
  );
}

void openAddresses(BuildContext context, MundoriaSession session) {
  Navigator.of(context).push(
    MaterialPageRoute<void>(
      builder: (_) => AddressesPage(session: session),
    ),
  );
}

void openSignUp(BuildContext context, MundoriaSession session, String role) {
  Navigator.of(context).push(
    MaterialPageRoute<void>(
      builder: (_) => SignUpPage(session: session, role: role),
    ),
  );
}

void openForgotPassword(BuildContext context, MundoriaSession session) {
  Navigator.of(context).push(
    MaterialPageRoute<void>(
      builder: (_) => ForgotPasswordPage(session: session),
    ),
  );
}

class CustomerVisitPage extends StatefulWidget {
  const CustomerVisitPage({
    super.key,
    required this.session,
    required this.visit,
  });

  final MundoriaSession session;
  final Visit visit;

  @override
  State<CustomerVisitPage> createState() => _CustomerVisitPageState();
}

class _CustomerVisitPageState extends State<CustomerVisitPage> {
  @override
  Widget build(BuildContext context) {
    final visit = widget.visit;
    return Scaffold(
      appBar: AppBar(title: Text(serviceLabel(visit.serviceType))),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
        children: [
          Text(
            formatVisitWhen(visit.date, visit.startTime),
            style: const TextStyle(color: MundoriaColors.ink, fontSize: 18),
          ),
          if (visit.place.isNotEmpty)
            Text(visit.place, style: const TextStyle(color: MundoriaColors.muted)),
          const SizedBox(height: 8),
          Text(statusLabel(visit.status), style: const TextStyle(color: MundoriaColors.orange)),
          Text(formatPence(visit.amountPence), style: const TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 20),
          VisitDesk(session: widget.session, visit: visit),
        ],
      ),
    );
  }
}

class AddressesPage extends StatefulWidget {
  const AddressesPage({super.key, required this.session});

  final MundoriaSession session;

  @override
  State<AddressesPage> createState() => _AddressesPageState();
}

class _AddressesPageState extends State<AddressesPage> {
  late Future<List<Map<String, dynamic>>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<Map<String, dynamic>>> _load() async {
    final rows = await widget.session.client
        .from('addresses')
        .select(
          'id, label, address_line_1, address_line_2, city, postcode, property_type, num_bedrooms, num_bathrooms, special_requirements',
        )
        .eq('customer_id', widget.session.profile!.id)
        .order('created_at');
    return rows.map((row) => Map<String, dynamic>.from(row)).toList();
  }

  Future<void> _delete(String id) async {
    await widget.session.client
        .from('addresses')
        .delete()
        .eq('id', id)
        .eq('customer_id', widget.session.profile!.id);
    setState(() => _future = _load());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Addresses')),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _future,
        builder: (context, snapshot) {
          final rows = snapshot.data ?? const <Map<String, dynamic>>[];
          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              if (snapshot.hasError)
                Text('${snapshot.error}', style: const TextStyle(color: MundoriaColors.orange)),
              for (final row in rows)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text('${row['address_line_1']}, ${row['city']} ${row['postcode']}'),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        onPressed: () async {
                          await Navigator.of(context).push(
                            MaterialPageRoute<void>(
                              builder: (_) => AddressForm(
                                session: widget.session,
                                existing: row,
                              ),
                            ),
                          );
                          setState(() => _future = _load());
                        },
                        icon: const Icon(Icons.edit_outlined),
                      ),
                      IconButton(
                        onPressed: () => _delete('${row['id']}'),
                        icon: const Icon(Icons.delete_outline),
                      ),
                    ],
                  ),
                ),
              FilledButton(
                onPressed: () async {
                  await Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => AddressForm(session: widget.session),
                    ),
                  );
                  setState(() => _future = _load());
                },
                child: const Text('Add an address'),
              ),
            ],
          );
        },
      ),
    );
  }
}

class AddressForm extends StatefulWidget {
  const AddressForm({super.key, required this.session, this.existing});

  final MundoriaSession session;
  final Map<String, dynamic>? existing;

  @override
  State<AddressForm> createState() => _AddressFormState();
}

class _AddressFormState extends State<AddressForm> {
  late final TextEditingController _line;
  late final TextEditingController _line2;
  late final TextEditingController _city;
  late final TextEditingController _postcode;
  late final TextEditingController _label;
  late final TextEditingController _beds;
  late final TextEditingController _baths;
  late final TextEditingController _notes;
  late String _property;
  String? _error;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    final existing = widget.existing;
    _line = TextEditingController(text: '${existing?['address_line_1'] ?? ''}');
    _line2 = TextEditingController(text: '${existing?['address_line_2'] ?? ''}');
    _city = TextEditingController(text: '${existing?['city'] ?? 'Birmingham'}');
    _postcode = TextEditingController(text: '${existing?['postcode'] ?? ''}');
    _label = TextEditingController(text: '${existing?['label'] ?? ''}');
    _beds = TextEditingController(text: '${existing?['num_bedrooms'] ?? 1}');
    _baths = TextEditingController(text: '${existing?['num_bathrooms'] ?? 1}');
    _notes = TextEditingController(text: '${existing?['special_requirements'] ?? ''}');
    _property = '${existing?['property_type'] ?? 'house'}';
    if (!['house', 'flat', 'office', 'other'].contains(_property)) _property = 'house';
  }

  @override
  void dispose() {
    _line.dispose();
    _line2.dispose();
    _city.dispose();
    _postcode.dispose();
    _label.dispose();
    _beds.dispose();
    _baths.dispose();
    _notes.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    final body = {
      'address_line_1': _line.text.trim(),
      'address_line_2': _line2.text.trim(),
      'city': _city.text.trim(),
      'postcode': _postcode.text.trim(),
      'label': _label.text.trim(),
      'property_type': _property,
      'num_bedrooms': int.tryParse(_beds.text.trim()) ?? 1,
      'num_bathrooms': int.tryParse(_baths.text.trim()) ?? 1,
      'special_requirements': _notes.text.trim(),
      if (widget.existing == null) 'is_default': true,
      if (widget.existing != null) 'id': widget.existing!['id'],
    };
    try {
      final api = MundoriaApi(widget.session);
      if (widget.existing == null) {
        await api.post('/api/addresses', body);
      } else {
        await api.patch('/api/addresses', body);
      }
      if (mounted) Navigator.of(context).pop();
    } on MundoriaApiException catch (error) {
      setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.existing == null ? 'New address' : 'Edit address'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          TextField(controller: _label, decoration: const InputDecoration(labelText: 'Label')),
          const SizedBox(height: 12),
          TextField(controller: _line, decoration: const InputDecoration(labelText: 'Address')),
          const SizedBox(height: 12),
          TextField(controller: _line2, decoration: const InputDecoration(labelText: 'Address line 2')),
          const SizedBox(height: 12),
          TextField(controller: _city, decoration: const InputDecoration(labelText: 'City')),
          const SizedBox(height: 12),
          TextField(controller: _postcode, decoration: const InputDecoration(labelText: 'Postcode')),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: _property,
            decoration: const InputDecoration(labelText: 'Property'),
            items: const [
              DropdownMenuItem(value: 'house', child: Text('House')),
              DropdownMenuItem(value: 'flat', child: Text('Flat')),
              DropdownMenuItem(value: 'office', child: Text('Office')),
              DropdownMenuItem(value: 'other', child: Text('Other')),
            ],
            onChanged: (value) => setState(() => _property = value ?? 'house'),
          ),
          const SizedBox(height: 12),
          TextField(controller: _beds, decoration: const InputDecoration(labelText: 'Bedrooms'), keyboardType: TextInputType.number),
          const SizedBox(height: 12),
          TextField(controller: _baths, decoration: const InputDecoration(labelText: 'Bathrooms'), keyboardType: TextInputType.number),
          const SizedBox(height: 12),
          TextField(controller: _notes, decoration: const InputDecoration(labelText: 'Notes')),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: const TextStyle(color: MundoriaColors.orange)),
          ],
          const SizedBox(height: 16),
          FilledButton(onPressed: _busy ? null : _save, child: const Text('Save address')),
        ],
      ),
    );
  }
}

class BookingQuotePage extends StatefulWidget {
  const BookingQuotePage({super.key, required this.session});

  final MundoriaSession session;

  @override
  State<BookingQuotePage> createState() => _BookingQuotePageState();
}

class _ServiceChoice {
  const _ServiceChoice(
    this.value,
    this.label,
    this.category,
    this.hours,
    this.schedule,
  );

  final String value;
  final String label;
  final String category;
  final double hours;

  /// required, repeat, or once.
  final String schedule;
}

class _AddOnChoice {
  const _AddOnChoice(this.id, this.label, {this.categories = const [], this.services = const []});

  final String id;
  final String label;
  final List<String> categories;
  final List<String> services;

  bool matches(_ServiceChoice choice) {
    return categories.contains(choice.category) || services.contains(choice.value);
  }
}

const _services = [
  _ServiceChoice('regular', 'Regular cleaning', 'residential', 2, 'required'),
  _ServiceChoice('one_off', 'One-off cleaning', 'residential', 2.5, 'once'),
  _ServiceChoice('deep_clean', 'Deep cleaning', 'residential', 4, 'once'),
  _ServiceChoice('end_of_tenancy', 'End of tenancy', 'residential', 6, 'once'),
  _ServiceChoice('move_in', 'Move-in / move-out', 'residential', 5, 'once'),
  _ServiceChoice('airbnb_turnover', 'Airbnb turnover', 'short_term_rental', 3, 'required'),
  _ServiceChoice('holiday_let', 'Holiday let', 'residential', 3, 'required'),
  _ServiceChoice('serviced_accommodation', 'Serviced accommodation', 'short_term_rental', 3.5, 'required'),
  _ServiceChoice('office', 'Office cleaning', 'commercial', 3, 'required'),
  _ServiceChoice('retail_hospitality', 'Retail and hospitality', 'commercial', 3, 'required'),
  _ServiceChoice('educational_facility', 'Educational facility', 'commercial', 4, 'required'),
  _ServiceChoice('communal_area', 'Communal areas', 'commercial', 3, 'required'),
  _ServiceChoice('pregnancy_support', 'Pregnancy and postpartum', 'recovery', 3, 'repeat'),
  _ServiceChoice('illness_recovery', 'Illness and injury recovery', 'recovery', 4.5, 'repeat'),
  _ServiceChoice('hospital_discharge', 'Hospital discharge', 'recovery', 5, 'once'),
  _ServiceChoice('bereavement_support', 'Bereavement support', 'recovery', 4, 'repeat'),
];

const _addOnChoices = [
  _AddOnChoice('ironing', 'Ironing', categories: ['residential']),
  _AddOnChoice('cleaning_products', 'Cleaning products', categories: ['residential']),
  _AddOnChoice('inside_fridge', 'Inside fridge', categories: ['short_term_rental']),
  _AddOnChoice('inside_oven', 'Inside oven', categories: ['short_term_rental']),
  _AddOnChoice('inside_cabinets', 'Inside cabinets', categories: ['short_term_rental']),
  _AddOnChoice('interior_windows', 'Interior windows', categories: ['commercial', 'short_term_rental']),
  _AddOnChoice('balcony_patio', 'Balcony or patio', categories: ['short_term_rental']),
  _AddOnChoice('extra_bathroom_detail', 'Extra bathroom detail', categories: ['short_term_rental', 'recovery']),
  _AddOnChoice('linen_change', 'Linen change', services: ['airbnb_turnover', 'holiday_let', 'serviced_accommodation']),
  _AddOnChoice('recovery_priority', 'Recovery priority care', categories: ['recovery']),
];

const _attentionAreas = [
  'Kitchen',
  'Toilets',
  'Bedrooms',
  'Living areas',
  'Hallways / access',
  'Laundry area',
];

class _BookingQuotePageState extends State<BookingQuotePage> {
  final _line = TextEditingController();
  final _city = TextEditingController(text: 'Birmingham');
  final _postcode = TextEditingController();
  final _date = TextEditingController();
  final _time = TextEditingController(text: '09:00');
  final _promo = TextEditingController();
  final _pets = TextEditingController();
  final _notes = TextEditingController();
  final _beds = TextEditingController(text: '1');
  final _baths = TextEditingController(text: '1');
  final _officeQty = TextEditingController(text: '1');
  final _alternates = TextEditingController();
  final _customDates = TextEditingController();
  String _service = 'regular';
  String _standard = 'essential';
  String _pattern = 'weekly';
  String? _keys;
  String? _condition;
  String? _savedAddressId;
  String? _preferredCleanerId;
  String _officeSize = 'medium';
  bool _sameCleaner = true;
  bool _petsOn = false;
  final Set<String> _addOns = {};
  final Set<String> _areas = {};
  List<Map<String, dynamic>> _savedAddresses = const [];
  List<Map<String, String>> _cleaners = const [];
  String? _result;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _loadSaved();
  }

  Future<void> _loadSaved() async {
    final id = widget.session.profile?.id;
    if (id == null) return;
    final addresses = await widget.session.client
        .from('addresses')
        .select('id, address_line_1, city, postcode')
        .eq('customer_id', id);
    final bookings = await widget.session.client
        .from('bookings')
        .select('cleaner_id')
        .eq('customer_id', id)
        .not('cleaner_id', 'is', null);
    final cleanerIds = <String>{
      for (final row in bookings)
        if (row['cleaner_id'] is String) row['cleaner_id'] as String,
    };
    List<Map<String, String>> cleaners = const [];
    if (cleanerIds.isNotEmpty) {
      final profiles = await widget.session.client
          .from('cleaner_public_profiles')
          .select('id, full_name')
          .inFilter('id', cleanerIds.toList());
      cleaners = [
        for (final row in profiles)
          {'id': '${row['id']}', 'name': '${row['full_name']}'},
      ];
    }
    if (!mounted) return;
    setState(() {
      _savedAddresses = addresses.map((row) => Map<String, dynamic>.from(row)).toList();
      _cleaners = cleaners;
    });
  }

  _ServiceChoice get _choice =>
      _services.firstWhere((item) => item.value == _service);

  @override
  void dispose() {
    _line.dispose();
    _city.dispose();
    _postcode.dispose();
    _date.dispose();
    _time.dispose();
    _promo.dispose();
    _pets.dispose();
    _notes.dispose();
    _beds.dispose();
    _baths.dispose();
    _officeQty.dispose();
    _alternates.dispose();
    _customDates.dispose();
    super.dispose();
  }

  List<String> _split(String raw) {
    return raw
        .split(RegExp(r'[,\s]+'))
        .map((item) => item.trim())
        .where((item) => item.isNotEmpty)
        .toList();
  }

  Map<String, dynamic> _draft(String addressId) {
    final choice = _choice;
    final repeating = choice.schedule != 'once' && _pattern != 'one_off';
    final pets = _pets.text
        .split(',')
        .map((item) => item.trim())
        .where((item) => item.isNotEmpty)
        .toList();
    return {
      'addressId': addressId,
      'cleaningStandard': _standard,
      'isRecurring': repeating,
      'preferSameCleaner': _sameCleaner,
      'preferredCleanerId': _preferredCleanerId,
      'promoCode': _promo.text.trim(),
      'propertyCondition': _condition,
      'recurrencePattern': repeating ? _pattern : null,
      'customRecurrenceDates': _pattern == 'custom' ? _split(_customDates.text) : <String>[],
      'scheduledDate': _date.text.trim(),
      'scheduledTime': _time.text.trim(),
      'alternateTimes': _split(_alternates.text).take(6).toList(),
      'estimatedDurationHours': choice.hours,
      'selectedAddOns': _addOns.toList(),
      'serviceCategory': choice.category,
      'serviceType': choice.value,
      'specialAttentionAreas': _areas.toList(),
      'specialInstructions': _notes.text.trim(),
      'keysPolicy': _keys,
      'hasPets': _petsOn,
      'petTypes': _petsOn ? pets : <String>[],
      if (choice.category == 'commercial')
        'officeSpaces': [
          {
            'quantity': int.tryParse(_officeQty.text.trim()) ?? 1,
            'size': _officeSize,
            'spaceType': 'office_work_area',
          },
        ],
    };
  }

  Future<String> _saveAddress() async {
    if (_savedAddressId != null) return _savedAddressId!;
    final saved = await MundoriaApi(widget.session).post('/api/addresses', {
      'address_line_1': _line.text.trim(),
      'city': _city.text.trim(),
      'postcode': _postcode.text.trim(),
      'property_type': _choice.category == 'commercial' ? 'office' : 'house',
      'num_bedrooms': int.tryParse(_beds.text.trim()) ?? 1,
      'num_bathrooms': int.tryParse(_baths.text.trim()) ?? 1,
    });
    return (saved as Map)['address']['id'] as String;
  }

  Future<void> _checkPromo() async {
    setState(() {
      _busy = true;
      _result = null;
    });
    try {
      final addressId = await _saveAddress();
      final quote = await MundoriaApi(widget.session).post('/api/promos/validate', {
        'addressId': addressId,
        'cleaningStandard': _standard,
        'scheduledDate': _date.text.trim(),
        'scheduledTime': _time.text.trim(),
        'selectedAddOns': _addOns.toList(),
        'serviceType': _choice.value,
        'code': _promo.text.trim(),
      });
      final amount = (quote as Map)['amount'];
      final discount = quote['discount'];
      if (mounted) {
        setState(() {
          _result =
              'Code applied. ${formatPence(discount is num ? discount.round() : 0)} off, estimate ${formatPence(amount is num ? amount.round() : 0)}.';
        });
      }
    } on MundoriaApiException catch (error) {
      if (mounted) setState(() => _result = error.message);
    } catch (error) {
      if (mounted) setState(() => _result = '$error');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _book() async {
    setState(() {
      _busy = true;
      _result = null;
    });
    final api = MundoriaApi(widget.session);
    try {
      final addressId = await _saveAddress();
      final draft = _draft(addressId);
      final quote = await api.post('/api/bookings/payment-intent', draft);
      final amount = (quote as Map)['amount'];
      final pence = amount is num ? amount.round() : 0;
      final intentId = await confirmApiPayment(Map<String, dynamic>.from(quote));
      await api.post('/api/bookings', {
        ...draft,
        'paymentIntentId': intentId,
      });
      if (mounted) {
        setState(() => _result = 'Booked. The card hold is ${formatPence(pence)}.');
      }
    } on MundoriaApiException catch (error) {
      if (mounted) setState(() => _result = error.message);
    } catch (error) {
      if (mounted) {
        setState(() {
          _result = stripeSheetClosed(error)
              ? 'The card hold was not confirmed.'
              : '$error';
        });
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final choice = _choice;
    final addOns = _addOnChoices.where((item) => item.matches(choice)).toList();
    final patterns = choice.schedule == 'repeat'
        ? const ['one_off', 'weekly', 'fortnightly', 'monthly', 'custom']
        : const ['weekly', 'fortnightly', 'monthly', 'custom'];
    return Scaffold(
      appBar: AppBar(title: const Text('Book a session')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          DropdownButtonFormField<String>(
            value: _service,
            decoration: const InputDecoration(labelText: 'Service'),
            items: [
              for (final item in _services)
                DropdownMenuItem(value: item.value, child: Text(item.label)),
            ],
            onChanged: (value) => setState(() {
              _service = value ?? 'regular';
              if (_choice.schedule == 'once') _pattern = 'one_off';
              if (_choice.schedule == 'required' && _pattern == 'one_off') {
                _pattern = 'weekly';
              }
              final allowed = _addOnChoices.where((item) => item.matches(_choice));
              _addOns.removeWhere((id) => !allowed.any((option) => option.id == id));
              if (_choice.category != 'recovery') _areas.clear();
            }),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: _standard,
            decoration: const InputDecoration(labelText: 'Standard'),
            items: const [
              DropdownMenuItem(value: 'essential', child: Text('Essential')),
              DropdownMenuItem(value: 'enhanced', child: Text('Enhanced')),
              DropdownMenuItem(value: 'comprehensive', child: Text('Comprehensive')),
            ],
            onChanged: (value) => setState(() => _standard = value ?? 'essential'),
          ),
          const SizedBox(height: 12),
          if (_savedAddresses.isNotEmpty)
            DropdownButtonFormField<String?>(
              value: _savedAddressId,
              decoration: const InputDecoration(labelText: 'Saved address'),
              items: [
                const DropdownMenuItem(value: null, child: Text('Type a new address')),
                for (final address in _savedAddresses)
                  DropdownMenuItem(
                    value: '${address['id']}',
                    child: Text(
                      '${address['address_line_1']}, ${address['postcode']}',
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
              ],
              onChanged: (value) => setState(() => _savedAddressId = value),
            ),
          if (_savedAddressId == null) ...[
            TextField(controller: _line, decoration: const InputDecoration(labelText: 'Address')),
            const SizedBox(height: 12),
            TextField(controller: _city, decoration: const InputDecoration(labelText: 'City')),
            const SizedBox(height: 12),
            TextField(controller: _postcode, decoration: const InputDecoration(labelText: 'Postcode')),
            const SizedBox(height: 12),
            TextField(controller: _beds, decoration: const InputDecoration(labelText: 'Bedrooms'), keyboardType: TextInputType.number),
            const SizedBox(height: 12),
            TextField(controller: _baths, decoration: const InputDecoration(labelText: 'Bathrooms'), keyboardType: TextInputType.number),
            const SizedBox(height: 12),
          ],
          TextField(controller: _date, decoration: const InputDecoration(labelText: 'Date (YYYY-MM-DD)')),
          const SizedBox(height: 12),
          TextField(controller: _time, decoration: const InputDecoration(labelText: 'Time (HH:MM)')),
          if (choice.schedule != 'once') ...[
            DropdownButtonFormField<String>(
              value: patterns.contains(_pattern) ? _pattern : patterns.first,
              decoration: const InputDecoration(labelText: 'How often'),
              items: [
                for (final pattern in patterns)
                  DropdownMenuItem(
                    value: pattern,
                    child: Text(pattern == 'one_off' ? 'One-off' : pattern),
                  ),
              ],
              onChanged: (value) => setState(() => _pattern = value ?? 'weekly'),
            ),
            if (_pattern == 'custom')
              TextField(
                controller: _customDates,
                decoration: const InputDecoration(
                  labelText: 'Custom dates, separated by commas',
                ),
              ),
          ],
          TextField(
            controller: _alternates,
            decoration: const InputDecoration(
              labelText: 'Other times that work (HH:MM, separated by commas)',
            ),
          ),
          if (choice.category != 'commercial')
            DropdownButtonFormField<String?>(
              value: _condition,
              decoration: const InputDecoration(labelText: 'Home condition'),
              items: const [
                DropdownMenuItem(value: null, child: Text('No extra note')),
                DropdownMenuItem(value: 'maintained', child: Text('Cleaned regularly')),
                DropdownMenuItem(value: 'extra_attention', child: Text('Needs a little extra attention')),
                DropdownMenuItem(value: 'neglected', child: Text('Not cleaned for quite some time')),
              ],
              onChanged: (value) => setState(() => _condition = value),
            ),
          if (_cleaners.isNotEmpty)
            DropdownButtonFormField<String?>(
              value: _preferredCleanerId,
              decoration: const InputDecoration(labelText: 'Preferred cleaner'),
              items: [
                const DropdownMenuItem(value: null, child: Text('No preference')),
                for (final cleaner in _cleaners)
                  DropdownMenuItem(value: cleaner['id'], child: Text(cleaner['name'] ?? '')),
              ],
              onChanged: (value) => setState(() => _preferredCleanerId = value),
            ),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Prefer the same cleaner'),
            value: _sameCleaner,
            onChanged: (value) => setState(() => _sameCleaner = value),
          ),
          DropdownButtonFormField<String?>(
            value: _keys,
            decoration: const InputDecoration(labelText: 'Keys'),
            items: const [
              DropdownMenuItem(value: null, child: Text('I will be home')),
              DropdownMenuItem(value: 'with_cleaner', child: Text('Leave keys with the cleaner')),
              DropdownMenuItem(value: 'key_box', child: Text('Key box')),
            ],
            onChanged: (value) => setState(() => _keys = value),
          ),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Pets at home'),
            value: _petsOn,
            onChanged: (value) => setState(() => _petsOn = value),
          ),
          if (_petsOn)
            TextField(
              controller: _pets,
              decoration: const InputDecoration(labelText: 'Pet types, separated by commas'),
            ),
          if (choice.category == 'recovery')
            Wrap(
              spacing: 8,
              children: [
                for (final area in _attentionAreas)
                  FilterChip(
                    label: Text(area),
                    selected: _areas.contains(area),
                    onSelected: (selected) => setState(() {
                      if (selected) {
                        _areas.add(area);
                      } else {
                        _areas.remove(area);
                      }
                    }),
                  ),
              ],
            ),
          if (choice.category == 'commercial') ...[
            TextField(
              controller: _officeQty,
              decoration: const InputDecoration(labelText: 'Work areas'),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _officeSize,
              decoration: const InputDecoration(labelText: 'Office size'),
              items: const [
                DropdownMenuItem(value: 'small', child: Text('Small')),
                DropdownMenuItem(value: 'medium', child: Text('Medium')),
                DropdownMenuItem(value: 'large', child: Text('Large')),
                DropdownMenuItem(value: 'not_sure', child: Text('Not sure')),
              ],
              onChanged: (value) => setState(() => _officeSize = value ?? 'medium'),
            ),
          ],
          const SizedBox(height: 8),
          for (final option in addOns)
            CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              value: _addOns.contains(option.id),
              title: Text(option.label),
              onChanged: (value) => setState(() {
                if (value == true) {
                  _addOns.add(option.id);
                } else {
                  _addOns.remove(option.id);
                }
              }),
            ),
          TextField(
            controller: _promo,
            decoration: const InputDecoration(labelText: 'Promo code'),
            onChanged: (_) => setState(() {}),
          ),
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton(
              onPressed: _busy || _promo.text.trim().isEmpty ? null : _checkPromo,
              child: const Text('Check promo code'),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _notes,
            minLines: 2,
            maxLines: 4,
            decoration: const InputDecoration(labelText: 'Notes for the cleaner'),
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _busy ? null : _book,
            child: Text(_busy ? 'Booking…' : 'Hold the card and book'),
          ),
          if (_result != null) ...[
            const SizedBox(height: 16),
            Text(_result!, style: const TextStyle(color: MundoriaColors.ink, height: 1.4)),
          ],
        ],
      ),
    );
  }
}
