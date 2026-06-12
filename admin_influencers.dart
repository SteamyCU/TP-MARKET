import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'dart:math';
import 'package:intl/intl.dart';

class AdminInfluencerManagement extends StatefulWidget {
  const AdminInfluencerManagement({super.key});

  @override
  State<AdminInfluencerManagement> createState() => _AdminInfluencerManagementState();
}

class _AdminInfluencerManagementState extends State<AdminInfluencerManagement> {
  // Colores corporativos
  static const Color tpBlue = Color(0xFF1B4B72);
  static const Color tpRed = Color(0xFFE8253A);
  
  final NumberFormat currencyFormat = NumberFormat.currency(symbol: '€', locale: 'es_ES');

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text("Gestión de Influencers", style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: tpBlue,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance.collection('influencers').snapshots(),
        builder: (context, snapshot) {
          if (snapshot.hasError) return Center(child: Text("Error: ${snapshot.error}"));
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: tpBlue));
          }
          
          final docs = snapshot.data?.docs ?? [];
          if (docs.isEmpty) {
            return const Center(child: Text("No hay influencers registrados"));
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: docs.length,
            itemBuilder: (context, index) {
              final influencer = docs[index];
              final data = influencer.data() as Map<String, dynamic>;
              return _buildInfluencerCard(influencer.id, data);
            },
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showCreateInfluencerDialog(),
        backgroundColor: tpRed,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text("Nuevo Influencer", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _buildInfluencerCard(String id, Map<String, dynamic> data) {
    final bool isActive = data['activo'] ?? false;
    final String codigo = data['codigo'] ?? '---';
    final num ganancias = data['ganancias_pendientes'] ?? 0;
    final int referidos = data['total_referidos'] ?? 0;

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 2,
      shadowColor: Colors.black12,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        onTap: () => _showInfluencerDetail(id, data),
        title: Row(
          children: [
            Expanded(
              child: Text(
                data['nombre'] ?? 'Sin nombre',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: tpBlue),
              ),
            ),
            _buildStatusChip(isActive),
          ],
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.qr_code, size: 14, color: Colors.grey),
                const SizedBox(width: 4),
                Text("CÓDIGO: $codigo", style: const TextStyle(fontWeight: FontWeight.bold, color: tpRed)),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text("Referidos: $referidos", style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                Text(
                  "Pendiente: ${currencyFormat.format(ganancias)}",
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.green),
                ),
              ],
            ),
          ],
        ),
        trailing: const Icon(Icons.chevron_right, color: tpBlue),
      ),
    );
  }

  Widget _buildStatusChip(bool isActive) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: isActive ? Colors.green.withOpacity(0.1) : Colors.red.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isActive ? Colors.green : Colors.red, width: 1),
      ),
      child: Text(
        isActive ? "ACTIVO" : "INACTIVO",
        style: TextStyle(
          color: isActive ? Colors.green : Colors.red,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  void _showInfluencerDetail(String id, Map<String, dynamic> data) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _InfluencerDetailSheet(id: id, initialData: data),
    );
  }

  void _showCreateInfluencerDialog() {
    final nameController = TextEditingController();
    final emailController = TextEditingController();
    final phoneController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Nuevo Influencer", style: TextStyle(color: tpBlue, fontWeight: FontWeight.bold)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: nameController, decoration: const InputDecoration(labelText: "Nombre")),
              TextField(controller: emailController, decoration: const InputDecoration(labelText: "Email")),
              TextField(controller: phoneController, decoration: const InputDecoration(labelText: "Teléfono")),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text("Cancelar")),
          ElevatedButton(
            onPressed: () async {
              if (nameController.text.isEmpty) return;
              
              // Generar código: 3 letras nombre + 2 números
              String prefix = nameController.text.length >= 3 
                  ? nameController.text.substring(0, 3).toUpperCase() 
                  : nameController.text.toUpperCase().padRight(3, 'X');
              String suffix = (Random().nextInt(90) + 10).toString();
              String codigo = "$prefix$suffix";
              String enlace = "topaquete.es/?ref=$codigo";

              await FirebaseFirestore.instance.collection('influencers').add({
                'nombre': nameController.text,
                'email': emailController.text,
                'telefono': phoneController.text,
                'codigo': codigo,
                'enlace_ref': enlace,
                'activo': true,
                'comision_porcentaje': 10,
                'minimo_pago': 50,
                'total_referidos': 0,
                'ganancias_pendientes': 0,
                'beneficio_cliente': {
                  'tipo': 'Descuento en €',
                  'valor': 5,
                  'descripcion': 'Obtienes 5€ de descuento en tu primer envío'
                },
                'pagos': [],
                'createdAt': FieldValue.serverTimestamp(),
              });
              
              if (mounted) Navigator.pop(context);
            },
            style: ElevatedButton.styleFrom(backgroundColor: tpBlue, foregroundColor: Colors.white),
            child: const Text("Crear"),
          ),
        ],
      ),
    );
  }
}

class _InfluencerDetailSheet extends StatefulWidget {
  final String id;
  final Map<String, dynamic> initialData;

  const _InfluencerDetailSheet({required this.id, required this.initialData});

  @override
  State<_InfluencerDetailSheet> createState() => _InfluencerDetailSheetState();
}

class _InfluencerDetailSheetState extends State<_InfluencerDetailSheet> {
  late bool isActive;
  late String selectedTipoBeneficio;
  late TextEditingController valorBeneficioController;
  late TextEditingController descBeneficioController;
  late TextEditingController comisionController;
  late TextEditingController minimoPagoController;

  static const List<String> tiposBeneficio = [
    "Descuento en €",
    "Descuento en %",
    "Envío gratis",
    "Crédito en cuenta"
  ];

  @override
  void initState() {
    super.initState();
    final data = widget.initialData;
    isActive = data['activo'] ?? false;
    final beneficio = data['beneficio_cliente'] ?? {};
    selectedTipoBeneficio = beneficio['tipo'] ?? tiposBeneficio[0];
    valorBeneficioController = TextEditingController(text: (beneficio['valor'] ?? 0).toString());
    descBeneficioController = TextEditingController(text: beneficio['descripcion'] ?? '');
    comisionController = TextEditingController(text: (data['comision_porcentaje'] ?? 0).toString());
    minimoPagoController = TextEditingController(text: (data['minimo_pago'] ?? 0).toString());
  }

  Future<void> _updateField(String field, dynamic value) async {
    await FirebaseFirestore.instance.collection('influencers').doc(widget.id).update({
      field: value,
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
      ),
      padding: EdgeInsets.only(
        top: 20,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2)))),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text("Configuración", style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF1B4B72))),
                Switch(
                  value: isActive,
                  activeColor: Colors.green,
                  onChanged: (val) {
                    setState(() => isActive = val);
                    _updateField('activo', val);
                  },
                ),
              ],
            ),
            const Divider(),
            
            // SECCIÓN BENEFICIO CLIENTE
            _buildSectionTitle("Beneficio para Clientes"),
            DropdownButtonFormField<String>(
              value: selectedTipoBeneficio,
              items: tiposBeneficio.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
              onChanged: (val) => setState(() => selectedTipoBeneficio = val!),
              decoration: const InputDecoration(labelText: "Tipo de beneficio"),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: valorBeneficioController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: "Valor del beneficio"),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: descBeneficioController,
              decoration: const InputDecoration(labelText: "Descripción para el cliente"),
              maxLines: 2,
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () => _updateField('beneficio_cliente', {
                'tipo': selectedTipoBeneficio,
                'valor': double.tryParse(valorBeneficioController.text) ?? 0,
                'descripcion': descBeneficioController.text,
              }),
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1B4B72), foregroundColor: Colors.white, minimumSize: const Size(double.infinity, 45)),
              child: const Text("Guardar Beneficio"),
            ),
            
            const SizedBox(height: 24),
            
            // SECCIÓN COMISIÓN
            _buildSectionTitle("Comisión del Influencer"),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: comisionController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: "% Comisión", suffixText: "%"),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: TextField(
                    controller: minimoPagoController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: "Mínimo Pago", suffixText: "€"),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () {
                _updateField('comision_porcentaje', double.tryParse(comisionController.text) ?? 0);
                _updateField('minimo_pago', double.tryParse(minimoPagoController.text) ?? 0);
              },
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1B4B72), foregroundColor: Colors.white, minimumSize: const Size(double.infinity, 45)),
              child: const Text("Guardar Comisión"),
            ),
            
            const SizedBox(height: 24),
            
            // HISTORIAL DE PAGOS
            _buildSectionTitle("Historial de Pagos"),
            _buildPaymentHistory(widget.initialData['pagos'] ?? []),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFFE8253A))),
    );
  }

  Widget _buildPaymentHistory(List<dynamic> pagos) {
    if (pagos.isEmpty) return const Text("No hay pagos registrados", style: TextStyle(color: Colors.grey, fontSize: 13));
    return Column(
      children: pagos.map((p) {
        final data = p as Map<String, dynamic>;
        return ListTile(
          dense: true,
          contentPadding: EdgeInsets.zero,
          leading: const Icon(Icons.payment, size: 20, color: Colors.green),
          title: Text("${data['monto']}€", style: const TextStyle(fontWeight: FontWeight.bold)),
          subtitle: Text(data['fecha'] ?? 'Fecha desconocida'),
          trailing: const Text("Pagado", style: TextStyle(color: Colors.green, fontSize: 12, fontWeight: FontWeight.bold)),
        );
      }).toList(),
    );
  }
}
