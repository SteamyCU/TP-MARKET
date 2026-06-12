import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:intl/intl.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';

class TicketChatScreen extends StatefulWidget {
  final String ticketId;
  final Map<String, dynamic> ticketData;
  final String currentUserRole;
  final String currentUserName;

  const TicketChatScreen({
    super.key, 
    required this.ticketId, 
    required this.ticketData,
    required this.currentUserRole,
    required this.currentUserName
  });

  @override
  State<TicketChatScreen> createState() => _TicketChatScreenState();
}

class _TicketChatScreenState extends State<TicketChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isSending = false;

  static const Color tpBlue = Color(0xFF1B4B72);
  static const Color tpRed = Color(0xFFE8253A);

  @override
  void initState() {
    super.initState();
    _markAsRead();
  }

  Future<void> _markAsRead() async {
    // Solo el creador o el asignado pueden marcar como leído
    await FirebaseFirestore.instance.collection('tickets').doc(widget.ticketId).update({
      'mensajes_no_leidos': 0,
    });
  }

  Future<void> _sendMessage({String? text, String? fotoUrl}) async {
    if ((text == null || text.trim().isEmpty) && fotoUrl == null) return;

    setState(() => _isSending = true);

    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) return;

      final messageData = {
        'texto': text?.trim(),
        'autor_uid': user.uid,
        'autor_nombre': widget.currentUserName,
        'autor_rol': widget.currentUserRole,
        'timestamp': FieldValue.serverTimestamp(),
        'foto_url': fotoUrl,
        'leido': false,
      };

      await FirebaseFirestore.instance
          .collection('tickets')
          .doc(widget.ticketId)
          .collection('mensajes')
          .add(messageData);

      await FirebaseFirestore.instance.collection('tickets').doc(widget.ticketId).update({
        'timestamp_ultima_actualizacion': FieldValue.serverTimestamp(),
        'mensajes_no_leidos': FieldValue.increment(1),
      });

      _messageController.clear();
      _scrollController.animateTo(0, duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error al enviar: $e")));
    } finally {
      setState(() => _isSending = false);
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      // Nota: Aquí iría la lógica de subida a Firebase Storage
      _sendMessage(fotoUrl: "https://placeholder.com/chat-image.jpg");
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool isAdminOrAgent = widget.currentUserRole == 'admin' || widget.currentUserRole == 'agente';

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.ticketData['asunto'] ?? 'Ticket', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text(
              widget.ticketData['asignado_a'] != null 
                ? "Asignado a: ${widget.ticketData['asignado_a']['nombre']}" 
                : "Sin asignar",
              style: const TextStyle(fontSize: 11, color: Colors.white70),
            ),
          ],
        ),
        backgroundColor: tpBlue,
        foregroundColor: Colors.white,
        actions: [
          if (isAdminOrAgent)
            IconButton(
              icon: const Icon(Icons.settings_outlined),
              onPressed: () => _showManagementDialog(),
            ),
        ],
      ),
      body: Column(
        children: [
          _buildTicketInfo(),
          Expanded(
            child: StreamBuilder<QuerySnapshot>(
              stream: FirebaseFirestore.instance
                  .collection('tickets')
                  .doc(widget.ticketId)
                  .collection('mensajes')
                  .orderBy('timestamp', descending: true)
                  .snapshots(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                final messages = snapshot.data?.docs ?? [];
                return ListView.builder(
                  controller: _scrollController,
                  reverse: true,
                  padding: const EdgeInsets.all(16),
                  itemCount: messages.length,
                  itemBuilder: (context, index) {
                    final msg = messages[index].data() as Map<String, dynamic>;
                    return _buildMessageBubble(msg);
                  },
                );
              },
            ),
          ),
          _buildInputArea(),
        ],
      ),
    );
  }

  Widget _buildTicketInfo() {
    return Container(
      padding: const EdgeInsets.all(12),
      color: Colors.grey.shade50,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          _statusChip(widget.ticketData['estado'] ?? 'abierto'),
          _priorityChip(widget.ticketData['prioridad'] ?? 'media'),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(Map<String, dynamic> msg) {
    final bool isMe = msg['autor_uid'] == FirebaseAuth.instance.currentUser?.uid;
    final timestamp = msg['timestamp'] as Timestamp?;
    final timeStr = timestamp != null ? DateFormat('HH:mm').format(timestamp.toDate()) : '';

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        decoration: BoxDecoration(
          color: isMe ? tpBlue : Colors.grey.shade200,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isMe ? 16 : 0),
            bottomRight: Radius.circular(isMe ? 0 : 16),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (!isMe)
              Text(msg['autor_nombre'] ?? '', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: tpBlue)),
            if (msg['foto_url'] != null)
              Padding(
                padding: const EdgeInsets.only(top: 4, bottom: 4),
                child: ClipRRect(borderRadius: BorderRadius.circular(8), child: Image.network(msg['foto_url'], fit: BoxFit.cover)),
              ),
            if (msg['texto'] != null)
              Text(msg['texto'], style: TextStyle(color: isMe ? Colors.white : Colors.black87, fontSize: 14)),
            const SizedBox(height: 4),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(timeStr, style: TextStyle(fontSize: 9, color: isMe ? Colors.white70 : Colors.grey)),
                if (isMe) ...[
                  const SizedBox(width: 4),
                  Icon(Icons.done_all, size: 12, color: msg['leido'] == true ? Colors.greenAccent : Colors.white70),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.white, boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5))]),
      child: Row(
        children: [
          IconButton(icon: const Icon(Icons.add_photo_alternate_outlined, color: tpBlue), onPressed: _pickImage),
          Expanded(
            child: TextField(
              controller: _messageController,
              decoration: InputDecoration(
                hintText: "Escribe un mensaje...",
                filled: true,
                fillColor: Colors.grey.shade100,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              ),
            ),
          ),
          const SizedBox(width: 8),
          CircleAvatar(
            backgroundColor: tpBlue,
            child: IconButton(
              icon: _isSending ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Icon(Icons.send, color: Colors.white, size: 20),
              onPressed: () => _sendMessage(text: _messageController.text),
            ),
          ),
        ],
      ),
    );
  }

  void _showManagementDialog() {
    String currentEstado = widget.ticketData['estado'] ?? 'abierto';
    String currentPrioridad = widget.ticketData['prioridad'] ?? 'media';

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text("Gestión del Ticket", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: tpBlue)),
            const SizedBox(height: 20),
            _buildManagementOption("Estado", ["abierto", "en proceso", "resuelto", "cerrado"], currentEstado, (val) {
              FirebaseFirestore.instance.collection('tickets').doc(widget.ticketId).update({'estado': val});
              Navigator.pop(context);
            }),
            const SizedBox(height: 16),
            _buildManagementOption("Prioridad", ["baja", "media", "alta"], currentPrioridad, (val) {
              FirebaseFirestore.instance.collection('tickets').doc(widget.ticketId).update({'prioridad': val});
              Navigator.pop(context);
            }),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => Navigator.pop(context),
                style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                child: const Text("CERRAR"),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildManagementOption(String label, List<String> options, String current, Function(String) onSelect) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          children: options.map((opt) {
            bool isSelected = opt == current;
            return ChoiceChip(
              label: Text(opt.toUpperCase(), style: TextStyle(fontSize: 10, color: isSelected ? Colors.white : tpBlue, fontWeight: FontWeight.bold)),
              selected: isSelected,
              onSelected: (val) => onSelect(opt),
              selectedColor: tpBlue,
              backgroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: tpBlue)),
            );
          }).toList(),
        ),
      ],
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
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
      child: Text("ESTADO: ${estado.toUpperCase()}", style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold)),
    );
  }

  Widget _priorityChip(String prioridad) {
    Color color;
    switch (prioridad.toLowerCase()) {
      case 'alta': color = tpRed; break;
      case 'media': color = Colors.orange; break;
      default: color = Colors.blue;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
      child: Text("PRIORIDAD: ${prioridad.toUpperCase()}", style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold)),
    );
  }
}
