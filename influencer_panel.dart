import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:share_plus/share_plus.dart';
import 'package:intl/intl.dart';

class InfluencerPanelScreen extends StatefulWidget {
  const InfluencerPanelScreen({super.key});

  @override
  State<InfluencerPanelScreen> createState() => _InfluencerPanelScreenState();
}

class _InfluencerPanelScreenState extends State<InfluencerPanelScreen> {
  // Colores corporativos
  static const Color tpBlue = Color(0xFF1B4B72);
  static const Color tpRed = Color(0xFFE8253A);
  static const Color tpBackground = Colors.white;

  final String? uid = FirebaseAuth.instance.currentUser?.uid;
  final NumberFormat currencyFormat = NumberFormat.currency(symbol: '€', locale: 'es_ES');
  final DateFormat dateFormat = DateFormat('dd/MM/yyyy HH:mm');

  @override
  Widget build(BuildContext context) {
    if (uid == null) {
      return const Scaffold(body: Center(child: Text("No autenticado")));
    }

    return Scaffold(
      backgroundColor: tpBackground,
      appBar: AppBar(
        title: const Text("Panel de Afiliado", style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: tpBlue,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.help_outline),
            onPressed: () => _showHelp(context),
          ),
        ],
      ),
      body: StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
        stream: FirebaseFirestore.instance.collection('influencers').doc(uid).snapshots(),
        builder: (context, snapshot) {
          if (snapshot.hasError) return Center(child: Text("Error: ${snapshot.error}"));
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: tpBlue));
          }
          if (!snapshot.hasData || !snapshot.data!.exists) {
            return const Center(child: Text("Perfil de influencer no encontrado"));
          }

          final data = snapshot.data!.data()!;
          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(data),
                const SizedBox(height: 24),
                _buildReferralSection(data),
                const SizedBox(height: 24),
                _buildBenefitBanner(data['beneficio_cliente']),
                const SizedBox(height: 24),
                _buildStatsGrid(data),
                const SizedBox(height: 32),
                const Text(
                  "Últimos Referidos",
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: tpBlue),
                ),
                const SizedBox(height: 12),
                _buildReferralsList(),
                const SizedBox(height: 40),
                _buildPaymentButton(data['ganancias_pendientes'] ?? 0),
                const SizedBox(height: 20),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildHeader(Map<String, dynamic> data) {
    return Row(
      children: [
        CircleAvatar(
          radius: 35,
          backgroundColor: tpBlue.withOpacity(0.1),
          backgroundImage: data['foto_url'] != null ? NetworkImage(data['foto_url']) : null,
          child: data['foto_url'] == null 
              ? const Icon(Icons.person, size: 40, color: tpBlue) 
              : null,
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "¡Hola, ${data['nombre'] ?? 'Influencer'}!",
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.black, color: tpBlue),
              ),
              const Text(
                "Bienvenido a tu panel de control",
                style: TextStyle(color: Colors.grey, fontWeight: FontWeight.w500),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildReferralSection(Map<String, dynamic> data) {
    final String codigo = data['codigo'] ?? '---';
    final String enlace = data['enlace_ref'] ?? '---';

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 15, offset: const Offset(0, 5)),
        ],
      ),
      child: Column(
        children: [
          _buildCopyRow("Tu código único", codigo, () {
            Clipboard.setData(ClipboardData(text: codigo));
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Código copiado")));
          }),
          const Divider(height: 32),
          _buildShareRow("Enlace de referido", enlace, () {
            Share.share("¡Usa mi enlace para enviar tus paquetes a Cuba con ToPaquete! $enlace");
          }),
        ],
      ),
    );
  }

  Widget _buildCopyRow(String label, String value, VoidCallback onCopy) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.black, color: tpBlue, letterSpacing: 1.2)),
            ],
          ),
        ),
        IconButton(
          onPressed: onCopy,
          icon: const Icon(Icons.copy_rounded, color: tpBlue),
          style: IconButton.styleFrom(backgroundColor: tpBlue.withOpacity(0.05)),
        ),
      ],
    );
  }

  Widget _buildShareRow(String label, String value, VoidCallback onShare) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text(
                value,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 14, color: tpBlue, fontWeight: FontWeight.w500),
              ),
            ],
          ),
        ),
        IconButton(
          onPressed: onShare,
          icon: const Icon(Icons.share_rounded, color: tpRed),
          style: IconButton.styleFrom(backgroundColor: tpRed.withOpacity(0.05)),
        ),
      ],
    );
  }

  Widget _buildBenefitBanner(Map<String, dynamic>? beneficio) {
    if (beneficio == null) return const SizedBox.shrink();
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.green.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.green.shade100),
      ),
      child: Row(
        children: [
          const Icon(Icons.stars, color: Colors.green),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              beneficio['descripcion'] ?? "Tus clientes obtienen beneficios exclusivos",
              style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsGrid(Map<String, dynamic> data) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 16,
      crossAxisSpacing: 16,
      childAspectRatio: 1.4,
      children: [
        _buildStatCard("Referidos", data['total_referidos']?.toString() ?? "0", Icons.people_alt_rounded),
        _buildStatCard("Pedidos Mes", data['pedidos_mes']?.toString() ?? "0", Icons.shopping_bag_rounded),
        _buildStatCard("Pendiente", currencyFormat.format(data['ganancias_pendientes'] ?? 0), Icons.account_balance_wallet_rounded, isHighlight: true),
        _buildStatCard("Total Ganado", currencyFormat.format((data['ganancias_pendientes'] ?? 0) + (data['ganancias_pagadas'] ?? 0)), Icons.history_rounded),
      ],
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, {bool isHighlight = false}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isHighlight ? tpBlue : Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Icon(icon, color: isHighlight ? Colors.white70 : tpBlue.withOpacity(0.5), size: 20),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.black, color: isHighlight ? Colors.white : tpBlue),
              ),
              Text(
                label,
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: isHighlight ? Colors.white60 : Colors.grey),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildReferralsList() {
    return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
      stream: FirebaseFirestore.instance
          .collection('influencers')
          .doc(uid)
          .collection('referidos')
          .orderBy('fecha', descending: true)
          .limit(10)
          .snapshots(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator()));
        }
        if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(32),
              child: Text("Aún no tienes referidos", style: TextStyle(color: Colors.grey)),
            ),
          );
        }

        return Column(
          children: snapshot.data!.docs.map((doc) {
            final ref = doc.data();
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade100),
              ),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(color: tpBlue.withOpacity(0.05), shape: BoxShape.circle),
                    child: const Icon(Icons.person_outline, color: tpBlue, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(ref['cliente_nombre'] ?? "Cliente", style: const TextStyle(fontWeight: FontWeight.bold, color: tpBlue)),
                        Text(
                          ref['fecha'] != null ? dateFormat.format((ref['fecha'] as Timestamp).toDate()) : "---",
                          style: const TextStyle(fontSize: 11, color: Colors.grey),
                        ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        "+${currencyFormat.format(ref['comision_generada'] ?? 0)}",
                        style: const TextStyle(fontWeight: FontWeight.black, color: Colors.green, fontSize: 14),
                      ),
                      _buildStatusChip(ref['estado_pedido'] ?? 'Pendiente'),
                    ],
                  ),
                ],
              ),
            );
          }).toList(),
        );
      },
    );
  }

  Widget _buildStatusChip(String status) {
    Color color;
    switch (status.toLowerCase()) {
      case 'entregado': color = Colors.green; break;
      case 'en camino': color = tpBlue; break;
      case 'cancelado': color = tpRed; break;
      default: color = Colors.orange;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: color),
      ),
    );
  }

  Widget _buildPaymentButton(num pending) {
    final bool canRequest = pending > 0;
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: canRequest ? () => _requestPayment(pending) : null,
        style: ElevatedButton.styleFrom(
          backgroundColor: tpRed,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 18),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          elevation: 0,
          disabledBackgroundColor: Colors.grey.shade200,
        ),
        child: Text(
          canRequest ? "SOLICITAR PAGO (${currencyFormat.format(pending)})" : "SIN GANANCIAS PENDIENTES",
          style: const TextStyle(fontWeight: FontWeight.black, fontSize: 16),
        ),
      ),
    );
  }

  void _requestPayment(num amount) async {
    // Lógica para crear una solicitud de pago en Firestore
    try {
      await FirebaseFirestore.instance.collection('solicitudes_pago').add({
        'influencer_id': uid,
        'monto': amount,
        'fecha': FieldValue.serverTimestamp(),
        'estado': 'Pendiente',
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Solicitud de pago enviada correctamente")),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Error al enviar la solicitud")),
        );
      }
    }
  }

  void _showHelp(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text("¿Cómo funciona?", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: tpBlue)),
            const SizedBox(height: 16),
            const Text(
              "Comparte tu código o enlace con tus amigos y seguidores. Por cada envío que realicen, tú ganarás una comisión y ellos obtendrán un descuento especial.",
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey, height: 1.5),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(backgroundColor: tpBlue, foregroundColor: Colors.white, minimumSize: const Size(double.infinity, 50)),
              child: const Text("Entendido"),
            ),
          ],
        ),
      ),
    );
  }
}
