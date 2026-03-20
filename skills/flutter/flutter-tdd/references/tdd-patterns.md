# Flutter TDD Patterns

Concrete test patterns for Flutter applications. Adapt these examples to your project's specific libraries and conventions discovered in the EXPLORE phase.

> **Note:** Examples below use `mocktail` + `bloc_test` as the most common Flutter testing stack. If your project uses `mockito`, Riverpod, Provider, or other libraries, adapt the mock/state patterns accordingly.

---

## Mock Setup

### With Mocktail (no codegen)

```dart
import 'package:mocktail/mocktail.dart';

// Mock a repository interface
class MockInvoiceRepository extends Mock implements InvoiceRepository {}

// Mock a use case
class MockGetInvoicesUseCase extends Mock implements GetInvoicesUseCase {}

// Mock a remote data source
class MockInvoiceRemoteDataSource extends Mock implements InvoiceRemoteDataSource {}

// Mock a Cubit/BLoC for widget testing (requires bloc_test)
class MockInvoiceListCubit extends MockCubit<InvoiceListState>
    implements InvoiceListCubit {}
```

### With Mockito (codegen)

```dart
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';

@GenerateMocks([InvoiceRepository, GetInvoicesUseCase])
import 'my_test.mocks.dart'; // generated file
```

### Registering Fallback Values (Mocktail)

For custom types used in `any()` matchers, register fallback values in `setUpAll`:

```dart
setUpAll(() {
  registerFallbackValue(GetInvoicesRequest(skip: 0, take: 10));
  registerFallbackValue(const InvoiceListState());
});
```

---

## Cubit / BLoC Testing

### Basic Cubit Test with bloc_test

```dart
import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockGetInvoicesUseCase extends Mock implements GetInvoicesUseCase {}

void main() {
  late MockGetInvoicesUseCase mockGetInvoicesUseCase;

  setUp(() {
    mockGetInvoicesUseCase = MockGetInvoicesUseCase();
  });

  group('InvoiceListCubit', () {
    final invoices = [
      const InvoiceEntity(id: '1', title: 'Invoice A'),
      const InvoiceEntity(id: '2', title: 'Invoice B'),
    ];

    blocTest<InvoiceListCubit, InvoiceListState>(
      'emits [loading, loaded] when getInvoiceList succeeds',
      build: () {
        when(() => mockGetInvoicesUseCase.execute(any()))
            .thenAnswer((_) async => Result.success(
                  BillListEntity(items: invoices, totalCount: 2, hasMore: false),
                ));
        return InvoiceListCubit(getInvoicesUseCase: mockGetInvoicesUseCase);
      },
      act: (cubit) => cubit.getInvoiceList(),
      expect: () => [
        const InvoiceListState(isLoading: true),
        InvoiceListState(
          isLoading: false,
          invoices: invoices,
          totalRecords: 2,
          hasMoreData: false,
        ),
      ],
    );

    blocTest<InvoiceListCubit, InvoiceListState>(
      'emits [loading, error] when getInvoiceList fails',
      build: () {
        when(() => mockGetInvoicesUseCase.execute(any()))
            .thenAnswer((_) async => Result.failure('Network error'));
        return InvoiceListCubit(getInvoicesUseCase: mockGetInvoicesUseCase);
      },
      act: (cubit) => cubit.getInvoiceList(),
      expect: () => [
        const InvoiceListState(isLoading: true),
        const InvoiceListState(
          isLoading: false,
          errorMessage: 'Network error',
        ),
      ],
    );

    blocTest<InvoiceListCubit, InvoiceListState>(
      'emits state with updated search text when changeSearchText is called',
      build: () => InvoiceListCubit(getInvoicesUseCase: mockGetInvoicesUseCase),
      act: (cubit) => cubit.changeSearchText('test query'),
      expect: () => [
        const InvoiceListState(searchText: 'test query'),
      ],
    );
  });
}
```

### Testing with Service Locator (GetIt)

When the Cubit/BLoC resolves dependencies internally via a service locator:

```dart
import 'package:get_it/get_it.dart';

void main() {
  late MockGetInvoicesUseCase mockGetInvoicesUseCase;

  setUp(() {
    // Reset GetIt before each test to avoid cross-test contamination
    GetIt.instance.reset();

    mockGetInvoicesUseCase = MockGetInvoicesUseCase();

    // Register mocks in GetIt
    GetIt.instance.registerFactory<GetInvoicesUseCase>(
      () => mockGetInvoicesUseCase,
    );
  });

  tearDown(() {
    GetIt.instance.reset();
  });

  blocTest<InvoiceListCubit, InvoiceListState>(
    'emits [loading, loaded] when getInvoiceList succeeds',
    build: () => InvoiceListCubit(),
    act: (cubit) => cubit.getInvoiceList(),
    // ...
  );
}
```

### Testing with Riverpod

When using Riverpod, override providers in `ProviderScope`:

```dart
void main() {
  late MockInvoiceRepository mockRepository;

  setUp(() {
    mockRepository = MockInvoiceRepository();
  });

  testWidgets('should display invoices', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          invoiceRepositoryProvider.overrideWithValue(mockRepository),
        ],
        child: const MaterialApp(home: InvoiceListScreen()),
      ),
    );
  });
}
```

### Testing Initial State

```dart
test('initial state is correct', () {
  final cubit = InvoiceListCubit();
  expect(cubit.state, equals(const InvoiceListState()));
  expect(cubit.state.isLoading, isFalse);
  expect(cubit.state.invoices, isEmpty);
  expect(cubit.state.errorMessage, isNull);
});
```

---

## UseCase Testing

### Input / Output Contract

Before writing use case tests, document the contract so reviewers can quickly see what's being tested:

```
UseCase: ValidateTaxCodeUseCase
├── Input:  String (tax code)
├── Output: Result<TaxCodeValidationEntity>
├── Dependencies: OnboardingRepository
└── Test Matrix:
    ├── ✅ Valid tax code     → Result.success(TaxCodeValidationEntity)
    ├── ❌ Server error       → Result.failure('Server error', statusCode: 500)
    └── ❌ Network exception  → Result.failure('No internet')
```

This contract serves as a **test spec** — each row becomes a test case. Include it as a comment at the top of the test file or in the PLAN phase output for easy review.

### Example

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockOnboardingRepository extends Mock implements OnboardingRepository {}

void main() {
  late ValidateTaxCodeUseCase useCase;
  late MockOnboardingRepository mockRepository;

  setUp(() {
    mockRepository = MockOnboardingRepository();
    useCase = ValidateTaxCodeUseCase(mockRepository);
  });

  group('ValidateTaxCodeUseCase', () {
    test('should return validation entity when tax code is valid', () async {
      // Arrange
      const taxCode = '0123456789';
      final expected = const TaxCodeValidationEntity(
        isValid: true,
        companyName: 'Test Company',
      );
      when(() => mockRepository.validateTaxCode(taxCode: taxCode))
          .thenAnswer((_) async => Result.success(expected));

      // Act
      final result = await useCase.execute(taxCode);

      // Assert
      expect(result.success, isTrue);
      expect(result.value, equals(expected));
      verify(() => mockRepository.validateTaxCode(taxCode: taxCode)).called(1);
    });

    test('should return failure when repository fails', () async {
      // Arrange
      when(() => mockRepository.validateTaxCode(taxCode: any(named: 'taxCode')))
          .thenAnswer((_) async => Result.failure('Server error', statusCode: 500));

      // Act
      final result = await useCase.execute('0123456789');

      // Assert
      expect(result.success, isFalse);
      expect(result.message, equals('Server error'));
      expect(result.statusCode, equals(500));
    });

    test('should return failure when NetworkException is thrown', () async {
      // Arrange
      when(() => mockRepository.validateTaxCode(taxCode: any(named: 'taxCode')))
          .thenThrow(NetworkException('No internet', statusCode: 0));

      // Act
      final result = await useCase.execute('0123456789');

      // Assert
      expect(result.success, isFalse);
      expect(result.message, contains('No internet'));
    });
  });
}
```

---

## Repository Implementation Testing

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockOnboardingRemoteDataSource extends Mock
    implements OnboardingRemoteDataSource {}

void main() {
  late OnboardingRepositoryImpl repository;
  late MockOnboardingRemoteDataSource mockDataSource;

  setUp(() {
    mockDataSource = MockOnboardingRemoteDataSource();
    repository = OnboardingRepositoryImpl(mockDataSource);
  });

  group('OnboardingRepositoryImpl', () {
    group('getAccessToken', () {
      test('should return AccessTokenEntity when data source succeeds', () async {
        // Arrange
        const dto = AccessTokenDto(
          accessToken: 'token123',
          expiresIn: 3600,
        );
        when(() => mockDataSource.getAccessToken(
              merchantType: any(named: 'merchantType'),
              token: any(named: 'token'),
            )).thenAnswer((_) async => Result.success(dto));

        // Act
        final result = await repository.getAccessToken(
          merchantType: 'einvoice',
          token: 'auth-token',
        );

        // Assert
        expect(result.success, isTrue);
        expect(result.value?.accessToken, equals('token123'));
        expect(result.value?.expiresIn, equals(3600));
      });

      test('should return failure when data source fails', () async {
        // Arrange
        when(() => mockDataSource.getAccessToken(
              merchantType: any(named: 'merchantType'),
              token: any(named: 'token'),
            )).thenAnswer((_) async => Result.failure('Unauthorized', statusCode: 401));

        // Act
        final result = await repository.getAccessToken(
          merchantType: 'einvoice',
          token: 'bad-token',
        );

        // Assert
        expect(result.success, isFalse);
        expect(result.statusCode, equals(401));
      });
    });
  });
}
```

---

## Entity Testing

```dart
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('AccessTokenEntity', () {
    test('should create from DTO correctly', () {
      // Arrange
      const dto = AccessTokenDto(
        accessToken: 'token123',
        expiresIn: 3600,
      );

      // Act
      final entity = AccessTokenEntity.fromDto(dto);

      // Assert
      expect(entity.accessToken, equals('token123'));
      expect(entity.expiresIn, equals(3600));
    });

    test('should support value equality via Equatable', () {
      // Arrange
      const entity1 = AccessTokenEntity(accessToken: 'a', expiresIn: 100);
      const entity2 = AccessTokenEntity(accessToken: 'a', expiresIn: 100);
      const entity3 = AccessTokenEntity(accessToken: 'b', expiresIn: 200);

      // Assert
      expect(entity1, equals(entity2));
      expect(entity1, isNot(equals(entity3)));
    });

    test('should handle null values from DTO', () {
      // Arrange
      const dto = AccessTokenDto();

      // Act
      final entity = AccessTokenEntity.fromDto(dto);

      // Assert
      expect(entity.accessToken, isNull);
      expect(entity.expiresIn, isNull);
    });
  });
}
```

---

## Domain Logic / Business Rules Testing

Pure domain logic requires **no mocks** — these are the easiest and most valuable tests to write. Test functions, methods, and computations that contain business rules.

### Pure Functions / Static Methods

```dart
void main() {
  group('TaxCalculator', () {
    test('should calculate VAT at 10% for standard goods', () {
      // Arrange
      const amount = 1000000.0;

      // Act
      final vat = TaxCalculator.calculateVAT(amount, rate: TaxRate.standard);

      // Assert
      expect(vat, equals(100000.0));
    });

    test('should return 0 for exempt goods', () {
      expect(
        TaxCalculator.calculateVAT(1000000, rate: TaxRate.exempt),
        equals(0.0),
      );
    });

    test('should handle negative amounts gracefully', () {
      expect(
        TaxCalculator.calculateVAT(-100, rate: TaxRate.standard),
        equals(0.0), // or throws, depending on business rule
      );
    });
  });
}
```

### Entity Methods with Business Logic

```dart
void main() {
  group('InvoiceEntity business rules', () {
    test('should calculate total from line items', () {
      // Arrange
      final invoice = InvoiceEntity(
        lineItems: [
          LineItemEntity(quantity: 2, unitPrice: 50000),
          LineItemEntity(quantity: 1, unitPrice: 100000),
        ],
      );

      // Act & Assert
      expect(invoice.total, equals(200000));
    });

    test('should return true for overdue invoice', () {
      final invoice = InvoiceEntity(
        dueDate: DateTime(2025, 1, 1),
        status: InvoiceStatus.unpaid,
      );

      expect(invoice.isOverdue(now: DateTime(2025, 2, 1)), isTrue);
    });

    test('should not be overdue if already paid', () {
      final invoice = InvoiceEntity(
        dueDate: DateTime(2025, 1, 1),
        status: InvoiceStatus.paid,
      );

      expect(invoice.isOverdue(now: DateTime(2025, 2, 1)), isFalse);
    });
  });
}
```

### Validation Logic

```dart
void main() {
  group('TaxCodeValidator', () {
    test('should accept valid 10-digit tax code', () {
      expect(TaxCodeValidator.isValid('0123456789'), isTrue);
    });

    test('should accept valid 13-digit tax code with branch', () {
      expect(TaxCodeValidator.isValid('0123456789001'), isTrue);
    });

    test('should reject tax code with letters', () {
      expect(TaxCodeValidator.isValid('012345ABC9'), isFalse);
    });

    test('should reject empty string', () {
      expect(TaxCodeValidator.isValid(''), isFalse);
    });

    test('should reject null', () {
      expect(TaxCodeValidator.isValid(null), isFalse);
    });
  });
}
```

### Filtering / Sorting Logic

```dart
void main() {
  group('InvoiceFilter', () {
    final invoices = [
      InvoiceEntity(id: '1', status: InvoiceStatus.paid, amount: 100),
      InvoiceEntity(id: '2', status: InvoiceStatus.unpaid, amount: 300),
      InvoiceEntity(id: '3', status: InvoiceStatus.paid, amount: 200),
    ];

    test('should filter by status', () {
      final result = InvoiceFilter.byStatus(invoices, InvoiceStatus.paid);

      expect(result, hasLength(2));
      expect(result.every((i) => i.status == InvoiceStatus.paid), isTrue);
    });

    test('should sort by amount descending', () {
      final result = InvoiceFilter.sortByAmount(invoices, ascending: false);

      expect(result.map((i) => i.amount), orderedEquals([300, 200, 100]));
    });

    test('should return empty list when no matches', () {
      final result = InvoiceFilter.byStatus(invoices, InvoiceStatus.cancelled);

      expect(result, isEmpty);
    });
  });
}
```

---

## Utility / Helper Function Testing

Test extension methods, formatters, parsers, and converters. These are pure functions — **no mocks needed**.

### Extension Methods

```dart
void main() {
  group('StringExtensions', () {
    test('capitalize should uppercase first letter', () {
      expect('hello'.capitalize(), equals('Hello'));
    });

    test('capitalize should handle empty string', () {
      expect(''.capitalize(), equals(''));
    });

    test('capitalize should handle single character', () {
      expect('a'.capitalize(), equals('A'));
    });
  });

  group('DateTimeExtensions', () {
    test('should format to dd/MM/yyyy', () {
      final date = DateTime(2025, 3, 15);
      expect(date.toDayMonthYear(), equals('15/03/2025'));
    });

    test('should return true for same day', () {
      final date1 = DateTime(2025, 3, 15, 10, 30);
      final date2 = DateTime(2025, 3, 15, 22, 0);
      expect(date1.isSameDay(date2), isTrue);
    });
  });
}
```

### Formatters

```dart
void main() {
  group('CurrencyFormatter', () {
    test('should format number with thousand separators', () {
      expect(CurrencyFormatter.format(1000000), equals('1,000,000'));
    });

    test('should format with currency symbol', () {
      expect(
        CurrencyFormatter.format(1000000, symbol: 'VND'),
        equals('1,000,000 VND'),
      );
    });

    test('should handle zero', () {
      expect(CurrencyFormatter.format(0), equals('0'));
    });

    test('should handle negative numbers', () {
      expect(CurrencyFormatter.format(-5000), equals('-5,000'));
    });
  });
}
```

### Parsers / Converters

```dart
void main() {
  group('DateParser', () {
    test('should parse ISO 8601 date string', () {
      final result = DateParser.fromIso('2025-03-15T10:30:00Z');
      expect(result, equals(DateTime.utc(2025, 3, 15, 10, 30)));
    });

    test('should return null for invalid date string', () {
      expect(DateParser.tryFromIso('not-a-date'), isNull);
    });

    test('should handle empty string', () {
      expect(DateParser.tryFromIso(''), isNull);
    });
  });
}
```

### Enum with Behavior

```dart
void main() {
  group('InvoiceStatus', () {
    test('should return correct display label', () {
      expect(InvoiceStatus.paid.label, equals('Paid'));
      expect(InvoiceStatus.unpaid.label, equals('Unpaid'));
      expect(InvoiceStatus.cancelled.label, equals('Cancelled'));
    });

    test('should return correct color', () {
      expect(InvoiceStatus.paid.color, equals(Colors.green));
      expect(InvoiceStatus.unpaid.color, equals(Colors.orange));
    });

    test('should parse from string', () {
      expect(InvoiceStatus.fromString('paid'), equals(InvoiceStatus.paid));
    });

    test('should return null for unknown string', () {
      expect(InvoiceStatus.tryFromString('unknown'), isNull);
    });
  });
}
```

---

## DTO Testing (JSON Serialization)

```dart
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('AccessTokenDto', () {
    test('should deserialize from JSON correctly', () {
      // Arrange
      final json = {
        'access_token': 'token123',
        'expires_in': 3600,
      };

      // Act
      final dto = AccessTokenDto.fromJson(json);

      // Assert
      expect(dto.accessToken, equals('token123'));
      expect(dto.expiresIn, equals(3600));
    });

    test('should serialize to JSON correctly', () {
      // Arrange
      const dto = AccessTokenDto(
        accessToken: 'token123',
        expiresIn: 3600,
      );

      // Act
      final json = dto.toJson();

      // Assert
      expect(json['access_token'], equals('token123'));
      expect(json['expires_in'], equals(3600));
    });

    test('should handle null fields in JSON', () {
      // Arrange
      final json = <String, dynamic>{};

      // Act
      final dto = AccessTokenDto.fromJson(json);

      // Assert
      expect(dto.accessToken, isNull);
      expect(dto.expiresIn, isNull);
    });

    test('should round-trip JSON correctly', () {
      // Arrange
      const original = AccessTokenDto(
        accessToken: 'token123',
        expiresIn: 3600,
      );

      // Act
      final json = original.toJson();
      final restored = AccessTokenDto.fromJson(json);

      // Assert
      expect(restored.accessToken, equals(original.accessToken));
      expect(restored.expiresIn, equals(original.expiresIn));
    });
  });
}
```

---

## Widget Testing

### Screen Widget (Smart — with BlocProvider)

```dart
import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockInvoiceListCubit extends MockCubit<InvoiceListState>
    implements InvoiceListCubit {}

void main() {
  late MockInvoiceListCubit mockCubit;

  setUp(() {
    mockCubit = MockInvoiceListCubit();
  });

  Widget buildSubject() {
    return MaterialApp(
      home: BlocProvider<InvoiceListCubit>.value(
        value: mockCubit,
        child: const InvoiceListScreen(),
      ),
    );
  }

  group('InvoiceListScreen', () {
    testWidgets('should display loading indicator when loading', (tester) async {
      // Arrange
      when(() => mockCubit.state).thenReturn(
        const InvoiceListState(isLoading: true),
      );

      // Act
      await tester.pumpWidget(buildSubject());

      // Assert
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('should display invoice list when loaded', (tester) async {
      // Arrange
      final invoices = [
        const InvoiceEntity(id: '1', title: 'Invoice A'),
        const InvoiceEntity(id: '2', title: 'Invoice B'),
      ];
      when(() => mockCubit.state).thenReturn(
        InvoiceListState(invoices: invoices),
      );

      // Act
      await tester.pumpWidget(buildSubject());

      // Assert
      expect(find.text('Invoice A'), findsOneWidget);
      expect(find.text('Invoice B'), findsOneWidget);
    });

    testWidgets('should display error message when error occurs', (tester) async {
      // Arrange
      when(() => mockCubit.state).thenReturn(
        const InvoiceListState(errorMessage: 'Failed to load'),
      );

      // Act
      await tester.pumpWidget(buildSubject());

      // Assert
      expect(find.text('Failed to load'), findsOneWidget);
    });

    testWidgets('should display empty state when no invoices', (tester) async {
      // Arrange
      when(() => mockCubit.state).thenReturn(
        const InvoiceListState(invoices: []),
      );

      // Act
      await tester.pumpWidget(buildSubject());

      // Assert
      expect(find.byKey(const Key('empty-state')), findsOneWidget);
    });

    testWidgets('should call getInvoiceList on pull to refresh', (tester) async {
      // Arrange
      when(() => mockCubit.state).thenReturn(
        const InvoiceListState(invoices: []),
      );
      when(() => mockCubit.refresh()).thenAnswer((_) async {});

      // Act
      await tester.pumpWidget(buildSubject());
      await tester.fling(find.byType(ListView), const Offset(0, 300), 1000);
      await tester.pumpAndSettle();

      // Assert
      verify(() => mockCubit.refresh()).called(1);
    });
  });
}
```

### Presentational Widget (Dumb — inputs/callbacks)

```dart
void main() {
  group('InvoiceCard', () {
    testWidgets('should display invoice title and amount', (tester) async {
      // Arrange
      const invoice = InvoiceEntity(
        id: '1',
        title: 'Invoice A',
        amount: 1000000,
      );

      // Act
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: InvoiceCard(invoice: invoice),
          ),
        ),
      );

      // Assert
      expect(find.text('Invoice A'), findsOneWidget);
      expect(find.text('1,000,000'), findsOneWidget);
    });

    testWidgets('should call onTap when card is tapped', (tester) async {
      // Arrange
      String? tappedId;
      const invoice = InvoiceEntity(id: '1', title: 'Invoice A');

      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: InvoiceCard(
              invoice: invoice,
              onTap: (id) => tappedId = id,
            ),
          ),
        ),
      );
      await tester.tap(find.byType(InvoiceCard));

      // Assert
      expect(tappedId, equals('1'));
    });

    testWidgets('should show delete icon when in selection mode', (tester) async {
      // Arrange & Act
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: InvoiceCard(
              invoice: InvoiceEntity(id: '1', title: 'Test'),
              isSelectionMode: true,
            ),
          ),
        ),
      );

      // Assert
      expect(find.byIcon(Icons.check_box_outline_blank), findsOneWidget);
    });
  });
}
```

---

## Common Test Utilities

### Test Data Factory

Create reusable factory functions for test data to avoid duplication across test files:

```dart
// test/fixtures/invoice_fixtures.dart

InvoiceEntity createTestInvoice({
  String id = '1',
  String title = 'Test Invoice',
  double amount = 100000,
  String? status,
}) {
  return InvoiceEntity(
    id: id,
    title: title,
    amount: amount,
    status: status,
  );
}

List<InvoiceEntity> createTestInvoiceList(int count) {
  return List.generate(
    count,
    (i) => createTestInvoice(
      id: '${i + 1}',
      title: 'Invoice ${i + 1}',
      amount: (i + 1) * 100000,
    ),
  );
}
```

### JSON Fixture Loader

For testing API responses with realistic data:

```dart
// test/fixtures/fixture_reader.dart
import 'dart:io';

String readFixture(String name) {
  return File('test/fixtures/$name').readAsStringSync();
}

Map<String, dynamic> readJsonFixture(String name) {
  return jsonDecode(readFixture(name)) as Map<String, dynamic>;
}
```

### Widget Test Helper

Wrap widgets with the necessary providers for testing. Adapt to your project's state management:

```dart
// test/helpers/pump_app.dart

/// Basic widget wrapper — works for any Flutter project
extension PumpApp on WidgetTester {
  Future<void> pumpApp(
    Widget widget, {
    ThemeData? theme,
    List<NavigatorObserver>? navigatorObservers,
  }) {
    return pumpWidget(
      MaterialApp(
        theme: theme,
        navigatorObservers: navigatorObservers ?? [],
        home: Scaffold(body: widget),
      ),
    );
  }
}
```

#### BLoC/Cubit Projects

```dart
extension PumpAppWithBloc on WidgetTester {
  Future<void> pumpAppWithCubit<C extends Cubit<S>, S>(
    Widget widget, {
    required C cubit,
  }) {
    return pumpWidget(
      MaterialApp(
        home: BlocProvider<C>.value(
          value: cubit,
          child: widget,
        ),
      ),
    );
  }

  /// For screens needing multiple BLoC providers
  Future<void> pumpAppWithProviders(
    Widget widget, {
    required List<BlocProvider> providers,
  }) {
    return pumpWidget(
      MaterialApp(
        home: MultiBlocProvider(
          providers: providers,
          child: widget,
        ),
      ),
    );
  }
}
```

#### Riverpod Projects

```dart
extension PumpAppWithRiverpod on WidgetTester {
  Future<void> pumpAppWithOverrides(
    Widget widget, {
    List<Override> overrides = const [],
  }) {
    return pumpWidget(
      ProviderScope(
        overrides: overrides,
        child: MaterialApp(home: widget),
      ),
    );
  }
}
```

#### Projects with Localization

```dart
extension PumpAppWithL10n on WidgetTester {
  Future<void> pumpAppWithLocalization(
    Widget widget, {
    Locale locale = const Locale('en'),
  }) {
    return pumpWidget(
      MaterialApp(
        locale: locale,
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: Scaffold(body: widget),
      ),
    );
  }
}
```

### Async Helpers

```dart
// Testing async state changes with blocTest
blocTest<FeatureCubit, FeatureState>(
  'should handle sequential async operations',
  build: () {
    when(() => mockUseCase.execute(any()))
        .thenAnswer((_) async {
      await Future.delayed(const Duration(milliseconds: 100));
      return Result.success(data);
    });
    return FeatureCubit();
  },
  act: (cubit) => cubit.loadData(),
  wait: const Duration(milliseconds: 150),
  expect: () => [
    const FeatureState(isLoading: true),
    FeatureState(isLoading: false, data: data),
  ],
);

// Testing debounce in widget tests
testWidgets('should debounce search input', (tester) async {
  // Arrange
  when(() => mockCubit.state).thenReturn(const SearchState());

  await tester.pumpWidget(buildSubject());

  // Act — type fast
  await tester.enterText(find.byType(TextField), 'te');
  await tester.pump(const Duration(milliseconds: 200));
  await tester.enterText(find.byType(TextField), 'test');
  await tester.pump(const Duration(milliseconds: 500)); // debounce completes

  // Assert — only final value sent
  verify(() => mockCubit.changeSearchText('test')).called(1);
});
```

### Golden Test Helper (if using golden_toolkit or alchemist)

```dart
// test/helpers/golden_helper.dart

Future<void> testGoldenWidget(
  WidgetTester tester, {
  required String name,
  required Widget widget,
  Size surfaceSize = const Size(400, 800),
}) async {
  await tester.binding.setSurfaceSize(surfaceSize);
  await tester.pumpWidget(
    MaterialApp(home: Scaffold(body: widget)),
  );
  await tester.pumpAndSettle();
  await expectLater(
    find.byType(MaterialApp),
    matchesGoldenFile('goldens/$name.png'),
  );
}
```

---

## Testing Checklist

Before marking tests complete, verify:

### Domain Logic & Pure Functions (no mocks needed)
- [ ] Business rules tested (calculations, validations, status checks)
- [ ] Entity methods with logic tested (totals, derived values, predicates)
- [ ] Filtering / sorting logic tested (including empty results)
- [ ] Validation functions tested (valid, invalid, edge cases, null)
- [ ] Utility functions tested (formatters, parsers, converters, extensions)
- [ ] Enum behavior tested (labels, colors, fromString, helpers)
- [ ] Boundary values tested (zero, negative, max, min, empty)

### Unit Tests (Use Cases, Repositories, DTOs)
- [ ] All happy path scenarios tested
- [ ] Error/failure scenarios tested (Result.failure, Either.left, exceptions — per project pattern)
- [ ] Edge cases tested (null values, empty strings, boundary values)
- [ ] Mock interactions verified with `verify()` / `verifyNever()`
- [ ] Entity equality tested (Equatable props, Freezed equality)
- [ ] DTO JSON round-trip tested (fromJson → toJson → fromJson)
- [ ] DTO handles missing/null fields gracefully

### State Management Tests (BLoC, Cubit, StateNotifier, etc.)

- [ ] Initial state is correct
- [ ] Loading state transitions tested
- [ ] Success state with data tested
- [ ] Error state tested
- [ ] Empty state tested
- [ ] Sequential state transitions verified (loading → loaded, loading → error)
- [ ] Multiple calls / pagination handled correctly

### Widget Tests

- [ ] Widget renders correctly for each state (loading, loaded, error, empty)
- [ ] User interactions trigger correct callbacks/events
- [ ] Navigation works as expected
- [ ] Accessibility: semantic labels present where needed
- [ ] Edge cases: long text, missing data, single vs many items

### General

- [ ] Tests are independent (no shared mutable state between tests)
- [ ] `setUp` / `tearDown` clean up resources properly
- [ ] No flaky tests (avoid real timers, use `fakeAsync` or `pump`)
- [ ] Tests run green: `flutter test` (or project-specific command)
