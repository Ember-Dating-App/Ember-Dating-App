import '../database.dart';

class KvStore2a2d7c0fTable extends SupabaseTable<KvStore2a2d7c0fRow> {
  @override
  String get tableName => 'kv_store_2a2d7c0f';

  @override
  KvStore2a2d7c0fRow createRow(Map<String, dynamic> data) =>
      KvStore2a2d7c0fRow(data);
}

class KvStore2a2d7c0fRow extends SupabaseDataRow {
  KvStore2a2d7c0fRow(Map<String, dynamic> data) : super(data);

  @override
  SupabaseTable get table => KvStore2a2d7c0fTable();

  String get key => getField<String>('key')!;
  set key(String value) => setField<String>('key', value);

  dynamic get value => getField<dynamic>('value')!;
  set value(dynamic value) => setField<dynamic>('value', value);
}
