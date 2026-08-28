import 'package:intl/intl.dart';

final NumberFormat _currency = NumberFormat.simpleCurrency(decimalDigits: 2);

String formatCents(int cents) => _currency.format(cents / 100);
