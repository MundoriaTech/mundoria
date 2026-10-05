import 'package:flutter/material.dart';

class MundoriaColors {
  static const ink = Color(0xFF1C133B);
  static const purple = Color(0xFF312C79);
  static const orange = Color(0xFFD4694A);
  static const canvas = Color(0xFFF3F4F6);
  static const muted = Color(0xFF5A5470);
  static const line = Color(0xFFE5E7EB);
}

ThemeData mundoriaTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: MundoriaColors.purple,
    primary: MundoriaColors.purple,
    onPrimary: Colors.white,
    surface: Colors.white,
  );
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: MundoriaColors.canvas,
    appBarTheme: const AppBarTheme(
      backgroundColor: MundoriaColors.canvas,
      foregroundColor: MundoriaColors.ink,
      elevation: 0,
      scrolledUnderElevation: 0,
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: Colors.white,
      indicatorColor: MundoriaColors.canvas,
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        final selected = states.contains(WidgetState.selected);
        return TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: selected ? MundoriaColors.ink : MundoriaColors.muted,
        );
      }),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: MundoriaColors.ink,
        foregroundColor: Colors.white,
        minimumSize: const Size.fromHeight(48),
        shape: const StadiumBorder(),
        textStyle: const TextStyle(fontWeight: FontWeight.w600),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: const Color(0xFFECE8F2),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide.none,
      ),
    ),
  );
}
