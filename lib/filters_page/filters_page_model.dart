import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/form_field_controller.dart';
import 'filters_page_widget.dart' show FiltersPageWidget;
import 'package:flutter/material.dart';

class FiltersPageModel extends FlutterFlowModel<FiltersPageWidget> {
  ///  State fields for stateful widgets in this page.

  // State field(s) for ChoiceChips widget.
  FormFieldController<List<String>>? choiceChipsValueController;
  String? get choiceChipsValue =>
      choiceChipsValueController?.value?.firstOrNull;
  set choiceChipsValue(String? val) =>
      choiceChipsValueController?.value = val != null ? [val] : [];
  // State field(s) for DropDown widget.
  String? dropDownValue1;
  FormFieldController<String>? dropDownValueController1;
  // State field(s) for DropDown widget.
  String? dropDownValue2;
  FormFieldController<String>? dropDownValueController2;
  // State field(s) for DropDown widget.
  String? dropDownValue3;
  FormFieldController<String>? dropDownValueController3;
  // State field(s) for DropDown widget.
  String? dropDownValue4;
  FormFieldController<String>? dropDownValueController4;
  // State field(s) for DropDown widget.
  String? dropDownValue5;
  FormFieldController<String>? dropDownValueController5;
  // State field(s) for DropDown widget.
  String? dropDownValue6;
  FormFieldController<String>? dropDownValueController6;
  // State field(s) for DropDown widget.
  List<String>? dropDownValue7;
  FormFieldController<List<String>>? dropDownValueController7;
  // State field(s) for DropDown widget.
  List<String>? dropDownValue8;
  FormFieldController<List<String>>? dropDownValueController8;
  // State field(s) for DropDown widget.
  List<String>? dropDownValue9;
  FormFieldController<List<String>>? dropDownValueController9;
  // State field(s) for DropDown widget.
  List<String>? dropDownValue10;
  FormFieldController<List<String>>? dropDownValueController10;
  // State field(s) for DropDown widget.
  List<String>? dropDownValue11;
  FormFieldController<List<String>>? dropDownValueController11;
  // State field(s) for DropDown widget.
  List<String>? dropDownValue12;
  FormFieldController<List<String>>? dropDownValueController12;

  @override
  void initState(BuildContext context) {}

  @override
  void dispose() {}
}
