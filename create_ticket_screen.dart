import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';

class CreateTicketScreen extends StatefulWidget {
  final String userRole;
  final String userName;

  const CreateTicketScreen({
    super.key, 
    required this.userRole, 
    required this.userName
  });

  @override
  State<CreateTicketScreen> createState() => _CreateTicketScreenState();
}

class _CreateTicketScreenState extends State<CreateTicketScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _asuntoController = TextEditingController();
  final TextEditingController _descripcionController = TextEditingController();
  final TextEditingController _referenciaController = TextEditingController();
  
  String? _selectedTipo;
  File? _imageFile;
  bool _isSubmitting = false;

  static const Color tpBlue = Color(0xFF1B4B72);
  static const Color tpRed = Color(0xFFE8253A);

  List<String> get _tiposIncidencia {
    List<String> tipos = [
      "Problema con mi paquete",
      "Consulta sobre mi pedido",
      "Problema con pago",
      "Consulta sobre envíos a Cuba",
      "Problema técnico con la app",
      "Otro"
    ];
    if (widget.userRole == 'influencer') tipos.add("Consulta como influencer");
    if (widget.userRole == 'agente') tipos.add("Reporte de mi agente");
    return tipos;
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() => _imageFile = File(pickedFile.path));
    }
  }

  Future<void> _submitTicket() async {
    if (!_formKey.currentState!.validate() || _selectedTipo == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Por favor completa todos los campos obligatorios")),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) return;

      String? fotoUrl;
      // Nota: Aquí iría la lógica de subida a Firebase Storage si se adjunta imagen
      // Por simplicidad en este ejemplo, usaremos un placeholder si hay imagen
      if (_imageFile != null) fotoUrl = "https://placeholder.com/image.jpg";

      final ticketData = {
        'asunto': _asuntoController.text.trim(),
        'tipo': _selectedTipo,
        'descripcion': _descripcionController.text.trim(),
        'foto_url': fotoUrl,
        'estado': 'abierto',
        'prioridad': 'media',
        'creado_por': {
          'uid': user.uid,
          'nombre': widget.userName,
          'rol': widget.userRole,
        },
        'pedido_referencia': _referenciaController.text.trim().isEmpty ? null : _referenciaController.text.trim(),
        'asignado_a': null,
        'timestamp_creacion': FieldValue.serverTimestamp(),
        'timestamp_ultima_actualizacion': FieldValue.serverTimestamp(),
        'mensajes_no_leidos': 0,
      };

      await FirebaseFirestore.instance.collection('tickets').add(ticketData);

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Ticket creado correctamente")),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Error al crear ticket: $e")),
      );
    } finally {
      setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Nuevo Ticket de Soporte", style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: tpBlue,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text("Asunto", style: TextStyle(fontWeight: FontWeight.bold, color: tpBlue)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _asuntoController,
                maxLength: 100,
                decoration: _inputDecoration("Ej: Retraso en entrega"),
                validator: (v) => v!.isEmpty ? "Campo requerido" : null,
              ),
              const SizedBox(height: 16),
              const Text("Tipo de Incidencia", style: TextStyle(fontWeight: FontWeight.bold, color: tpBlue)),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                value: _selectedTipo,
                items: _tiposIncidencia.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                onChanged: (v) => setState(() => _selectedTipo = v),
                decoration: _inputDecoration("Selecciona una opción"),
                validator: (v) => v == null ? "Campo requerido" : null,
              ),
              const SizedBox(height: 16),
              const Text("Referencia de Pedido (Opcional)", style: TextStyle(fontWeight: FontWeight.bold, color: tpBlue)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _referenciaController,
                decoration: _inputDecoration("Ej: TP-123456"),
              ),
              const SizedBox(height: 16),
              const Text("Descripción", style: TextStyle(fontWeight: FontWeight.bold, color: tpBlue)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _descripcionController,
                maxLines: 5,
                decoration: _inputDecoration("Describe tu problema detalladamente..."),
                validator: (v) => v!.length < 20 ? "Mínimo 20 caracteres" : null,
              ),
              const SizedBox(height: 20),
              const Text("Adjuntar Imagen (Opcional)", style: TextStyle(fontWeight: FontWeight.bold, color: tpBlue)),
              const SizedBox(height: 8),
              GestureDetector(
                onTap: _pickImage,
                child: Container(
                  height: 120,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.shade300),
                  ),
                  child: _imageFile != null 
                    ? ClipRRect(borderRadius: BorderRadius.circular(12), child: Image.file(_imageFile!, fit: BoxFit.cover))
                    : const Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.add_a_photo, color: tpBlue, size: 30),
                          SizedBox(height: 8),
                          Text("Toca para añadir una foto", style: TextStyle(fontSize: 12, color: Colors.grey)),
                        ],
                      ),
                ),
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 55,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _submitTicket,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: tpBlue,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _isSubmitting 
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text("ENVIAR TICKET", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      filled: true,
      fillColor: Colors.grey.shade50,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade200)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: tpBlue, width: 2)),
    );
  }
}
