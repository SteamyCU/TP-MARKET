import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:intl/intl.dart';
import 'ticket_chat_screen.dart';
import 'create_ticket_screen.dart';

class TicketListScreen extends StatefulWidget {
  final String userRole;
  final String userName;

  const TicketListScreen({
    super.key, 
    required this.userRole, 
    required this.userName
  });

  @override
  State<TicketListScreen> createState() => _TicketListScreenState();
}

class _TicketListScreenState extends State<TicketListScreen> {
  String _filterEstado = 'Todos';
  String? _filterTipo;

  static const Color tpBlue = Color(0xFF1B4B72);
  static const Color tpRed = Color(0xFFE8253A);

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return const Scaffold(body: Center(child: Text("No autenticado")));

    Query query = FirebaseFirestore.instance.collection('tickets');

    // Filtrado por Rol
    if (widget.userRole == 'cliente' || widget.userRole == 'influencer') {
      query = query.where('creado_por.uid', isEqualTo: user.uid);
    } else if (widget.userRole == 'agente') {
      query = query.where('asignado_a.uid', isEqualTo: user.uid);
    }

    // Filtrado por Estado
    if (_filterEstado != 'Todos') {
      query = query.where('estado', isEqualTo: _filterEstado.toLowerCase());
    }

    // Filtrado por Tipo
    if (_filterTipo != null) {
      query = query.where('tipo', isEqualTo: _filterTipo);
    }

    query = query.orderBy('timestamp_ultima_actualizacion', descending: true);

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text("Soporte y Tickets", style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: tpBlue,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: Column(
        children: [
          _buildFilters(),
          Expanded(
            child: StreamBuilder<QuerySnapshot>(
              stream: query.snapshots(),
              builder: (context, snapshot) {
                if (snapshot.hasError) return Center(child: Text("Error: ${snapshot.error}"));
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator(color: tpBlue));
                }

                final tickets = snapshot.data?.docs ?? [];
                if (tickets.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.confirmation_number_outlined, size: 64, color: Colors.grey.shade300),
                        const SizedBox(height: 16),
                        const Text("No se encontraron tickets", style: TextStyle(color: Colors.grey)),
                      ],
                    ),
                  );
                }

                return ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: tickets.length,
                  itemBuilder: (context, index) {
                    final ticket = tickets[index];
                    final data = ticket.data() as Map<String, dynamic>;
                    return _buildTicketItem(ticket.id, data);
                  },
                );
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => CreateTicketScreen(userRole: widget.userRole, userName: widget.userName)),
        ),
        backgroundColor: tpRed,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildFilters() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      color: Colors.white,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            _filterChip('Todos'),
            _filterChip('Abierto'),
            _filterChip('En proceso'),
            _filterChip('Resuelto'),
            _filterChip('Cerrado'),
          ],
        ),
      ),
    );
  }

  Widget _filterChip(String label) {
    bool isSelected = _filterEstado == label;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (val) => setState(() => _filterEstado = label),
        selectedColor: tpBlue,
        labelStyle: TextStyle(color: isSelected ? Colors.white : tpBlue, fontWeight: FontWeight.bold),
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), borderSide: const BorderSide(color: tpBlue)),
      ),
    );
  }

  Widget _buildTicketItem(String id, Map<String, dynamic> data) {
    final timestamp = data['timestamp_ultima_actualizacion'] as Timestamp?;
    final dateStr = timestamp != null ? DateFormat('dd MMM, HH:mm').format(timestamp.toDate()) : '';
    final unread = data['mensajes_no_leidos'] ?? 0;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.grey.shade200)),
      child: ListTile(
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => TicketChatScreen(ticketId: id, ticketData: data, currentUserRole: widget.userRole, currentUserName: widget.userName)),
        ),
        contentPadding: const EdgeInsets.all(16),
        title: Row(
          children: [
            Expanded(
              child: Text(data['asunto'] ?? 'Sin asunto', style: const TextStyle(fontWeight: FontWeight.bold, color: tpBlue)),
            ),
            _statusChip(data['estado'] ?? 'abierto'),
          ],
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(data['tipo'] ?? '', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  widget.userRole == 'admin' ? "Cliente: ${data['creado_por']['nombre']}" : "Última act: $dateStr",
                  style: const TextStyle(fontSize: 11, color: Colors.grey),
                ),
                if (unread > 0)
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: const BoxDecoration(color: tpRed, shape: BoxShape.circle),
                    child: Text("$unread", style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _statusChip(String estado) {
    Color color;
    switch (estado.toLowerCase()) {
      case 'abierto': color = Colors.orange; break;
      case 'en proceso': color = tpBlue; break;
      case 'resuelto': color = Colors.green; break;
      default: color = Colors.grey;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
      child: Text(
        estado.toUpperCase(),
        style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold),
      ),
    );
  }
}
