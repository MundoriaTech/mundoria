import 'package:flutter/material.dart';

import '../labels.dart';
import '../theme.dart';
import '../visit.dart';

class VisitCard extends StatelessWidget {
  const VisitCard({super.key, required this.visit, this.amountLabel});

  final Visit visit;
  final String? amountLabel;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: MundoriaColors.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            serviceLabel(visit.serviceType),
            style: const TextStyle(
              color: MundoriaColors.ink,
              fontSize: 16,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            formatVisitWhen(visit.date, visit.startTime),
            style: const TextStyle(color: MundoriaColors.muted),
          ),
          if (visit.place.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              visit.place,
              style: const TextStyle(color: MundoriaColors.muted),
            ),
          ],
          const SizedBox(height: 10),
          Text(
            statusLabel(visit.status),
            style: const TextStyle(
              color: MundoriaColors.orange,
              fontWeight: FontWeight.w600,
            ),
          ),
          if (amountLabel != null) ...[
            const SizedBox(height: 4),
            Text(
              amountLabel!,
              style: const TextStyle(
                color: MundoriaColors.ink,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class VisitList extends StatelessWidget {
  const VisitList({
    super.key,
    required this.visits,
    this.empty = 'Nothing scheduled yet.',
    this.showAmount = false,
    this.onVisit,
  });

  final List<Visit> visits;
  final String empty;
  final bool showAmount;
  final ValueChanged<Visit>? onVisit;

  @override
  Widget build(BuildContext context) {
    if (visits.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 24),
        child: Text(
          empty,
          style: const TextStyle(color: MundoriaColors.muted, height: 1.4),
        ),
      );
    }
    return Column(
      children: [
        for (final visit in visits)
          GestureDetector(
            onTap: onVisit == null ? null : () => onVisit!(visit),
            child: VisitCard(
              visit: visit,
              amountLabel: showAmount ? formatPence(visit.amountPence) : null,
            ),
          ),
      ],
    );
  }
}
