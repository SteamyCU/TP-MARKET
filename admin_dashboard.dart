import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';
import 'package:timeago/timeago.dart' as timeago;

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  // Colores corporativos
  static const Color tpBlue = Color(0xFF1B4B72);
  static const Color tpRed = Color(0xFFE8253A);
  static const Color tpBg = Color(0xFFF8F9FB);

  final NumberFormat currencyFormat = NumberFormat.currency(symbol: '€', locale: 'es_ES');

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: tpBg,
      body: CustomScrollView(
        slivers: [
          // APP BAR
          SliverAppBar(
            expandedHeight: 120.0,
            floating: false,
            pinned: true,
            backgroundColor: tpBlue,
            flexibleSpace: FlexibleSpaceBar(
              title: const Text(
                "Panel de Control Admin",
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              background: Container(color: tpBlue),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.notifications_none_outlined),
                onPressed: () {},
              ),
              const CircleAvatar(
                radius: 18,
                backgroundColor: Colors.white24,
                child: Icon(Icons.person, color: Colors.white, size: 20),
              ),
              const SizedBox(width: 16),
            ],
          ),

          // SECCIÓN 1: MÉTRICAS DEL DÍA
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.only(top: 20, bottom: 10),
              child: _buildMetricsSection(),
            ),
          ),

          // SECCIÓN 2: ALERTAS URGENTES
          SliverToBoxAdapter(
            child: _buildSectionHeader("Alertas Urgentes", Icons.warning_amber_rounded, color: tpRed),
          ),
          _buildAlertsSection(),

          // SECCIÓN 3: ACCESOS RÁPIDOS
          SliverToBoxAdapter(
            child: _buildSectionHeader("Accesos Rápidos", Icons.grid_view_rounded),
          ),
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            sliver: _buildQuickAccessGrid(),
          ),

          // SECCIÓN 4: ACTIVIDAD RECIENTE
          SliverToBoxAdapter(
            child: _buildSectionHeader("Actividad Reciente", Icons.history_rounded),
          ),
          _buildRecentActivitySection(),

          const SliverToBoxAdapter(child: SizedBox(height: 40)),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon, {Color color = tpBlue}) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
      child: Row(
        children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(width: 8),
          Text(
            title.toUpperCase(),
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.black,
              color: color,
              letterSpacing: 1.2,
            ),
          ),
        ],
      ),
    );
  }

  // --- SECCIÓN 1: MÉTRICAS ---
  Widget _buildMetricsSection() {
    final now = DateTime.now();
    final startOfDay = DateTime(now.year, now.month, now.day);

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          _buildMetricCardStream(
            "Pedidos Hoy",
            FirebaseFirestore.instance.collection('paquetes').where('createdAt', '>=', startOfDay).snapshots(),
            Icons.local_shipping_rounded,
          ),
          _buildMetricCardStream(
            "Ingresos Hoy",
            FirebaseFirestore.instance.collection('pagos').where('fecha', '>=', startOfDay).snapshots(),
            Icons.euro_rounded,
            isCurrency: true,
          ),
          _buildMetricCardStream(
            "Tickets Abiertos",
            FirebaseFirestore.instance.collection('tickets').where('estado', '==', 'abierto').snapshots(),
            Icons.confirmation_number_rounded,
          ),
          _buildMetricCardStream(
            "Clientes Nuevos",
            FirebaseFirestore.instance.collection('clientes').where('createdAt', '>=', startOfDay).snapshots(),
            Icons.person_add_rounded,
          ),
          _buildMetricCardStream(
            "Influencers Act.",
            FirebaseFirestore.instance.collection('influencers').where('activo', '==', true).snapshots(),
            Icons.star_rounded,
          ),
        ],
      ),
    );
  }

  Widget _buildMetricCardStream(String label, Stream<QuerySnapshot> stream, IconData icon, {bool isCurrency = false}) {
    return StreamBuilder<QuerySnapshot>(
      stream: stream,
      builder: (context, snapshot) {
        num value = 0;
        if (snapshot.hasData) {
          if (isCurrency) {
            for (var doc in snapshot.data!.docs) {
              value += (doc.data() as Map<String, dynamic>)['monto'] ?? 0;
            }
          } else {
            value = snapshot.data!.docs.length;
          }
        }

        return Container(
          width: 140,
          margin: const EdgeInsets.symmetric(horizontal: 4),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 4))],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, color: tpBlue.withOpacity(0.5), size: 20),
              const SizedBox(height: 12),
              Text(
                isCurrency ? currencyFormat.format(value) : value.toString(),
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.black, color: tpBlue),
              ),
              Text(
                label,
                style: const TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        );
      },
    );
  }

  // --- SECCIÓN 2: ALERTAS ---
  Widget _buildAlertsSection() {
    final twoHoursAgo = DateTime.now().subtract(const Duration(hours: 2));

    return SliverList(
      delegate: SliverChildListDelegate([
        // Alerta 1: Tickets sin asignar
        StreamBuilder<QuerySnapshot>(
          stream: FirebaseFirestore.instance
              .collection('tickets')
              .where('asignado_a', isNull: true)
              .where('timestamp_creacion', '<=', twoHoursAgo)
              .snapshots(),
          builder: (context, snapshot) {
            if (!snapshot.hasData || snapshot.data!.docs.isEmpty) return const SizedBox.shrink();
            return _buildAlertItem(
              "Hay ${snapshot.data!.docs.length} tickets sin asignar (+2h)",
              "Asignar ahora",
              Icons.warning_rounded,
              () {},
            );
          },
        ),
        // Alerta 2: Pedidos con incidencia
        StreamBuilder<QuerySnapshot>(
          stream: FirebaseFirestore.instance.collection('paquetes').where('estado', '==', 'Incidencia').snapshots(),
          builder: (context, snapshot) {
            if (!snapshot.hasData || snapshot.data!.docs.isEmpty) return const SizedBox.shrink();
            return _buildAlertItem(
              "Hay ${snapshot.data!.docs.length} paquetes con incidencia",
              "Ver detalles",
              Icons.error_outline_rounded,
              () {},
            );
          },
        ),
        // Alerta 3: Pagos pendientes influencers
        StreamBuilder<QuerySnapshot>(
          stream: FirebaseFirestore.instance.collection('solicitudes_pago').where('estado', '==', 'Pendiente').snapshots(),
          builder: (context, snapshot) {
            if (!snapshot.hasData || snapshot.data!.docs.isEmpty) return const SizedBox.shrink();
            return _buildAlertItem(
              "Hay ${snapshot.data!.docs.length} pagos de influencers pendientes",
              "Gestionar",
              Icons.payments_outlined,
              () {},
            );
          },
        ),
      ]),
    );
  }

  Widget _buildAlertItem(String title, String actionLabel, IconData icon, VoidCallback onTap) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: tpRed.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: tpRed.withOpacity(0.1)),
      ),
      child: Row(
        children: [
          Icon(icon, color: tpRed, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              title,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: tpRed),
            ),
          ),
          TextButton(
            onPressed: onTap,
            style: TextButton.styleFrom(
              backgroundColor: tpRed,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              minimumSize: Size.zero,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: Text(actionLabel, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  // --- SECCIÓN 3: ACCESOS RÁPIDOS ---
  Widget _buildQuickAccessGrid() {
    return SliverGrid(
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 1,
      ),
      delegate: SliverChildListDelegate([
        _buildQuickButton("Pedidos", Icons.inventory_2_outlined),
        _buildQuickButton("Influencers", Icons.star_outline_rounded),
        _buildQuickButton("Agentes", Icons.support_agent_rounded),
        _buildQuickButton("Tickets", Icons.confirmation_number_outlined),
        _buildQuickButton("Precios", Icons.settings_suggest_outlined),
        _buildQuickButton("Reportes", Icons.bar_chart_rounded),
      ]),
    );
  }

  Widget _buildQuickButton(String label, IconData icon) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {},
          borderRadius: BorderRadius.circular(20),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: tpBlue, size: 28),
              const SizedBox(height: 8),
              Text(
                label,
                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: tpBlue),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // --- SECCIÓN 4: ACTIVIDAD RECIENTE ---
  Widget _buildRecentActivitySection() {
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance.collection('eventos').orderBy('timestamp', descending: true).limit(5).snapshots(),
      builder: (context, snapshot) {
        if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
          return const SliverToBoxAdapter(
            child: Center(child: Padding(padding: EdgeInsets.all(20), child: Text("No hay actividad reciente", style: TextStyle(color: Colors.grey)))),
          );
        }

        return SliverList(
          delegate: SliverChildBuilderDelegate(
            (context, index) {
              final event = snapshot.data!.docs[index].data() as Map<String, dynamic>;
              return _buildActivityItem(event);
            },
            childCount: snapshot.data!.docs.length,
          ),
        );
      },
    );
  }

  Widget _buildActivityItem(Map<String, dynamic> event) {
    final timestamp = event['timestamp'] as Timestamp?;
    final timeStr = timestamp != null ? timeago.format(timestamp.toDate(), locale: 'es') : 'ahora';
    
    IconData icon;
    Color color;
    switch (event['tipo']) {
      case 'nuevo_pedido':
        icon = Icons.add_shopping_cart_rounded;
        color = Colors.green;
        break;
      case 'ticket_creado':
        icon = Icons.support_rounded;
        color = Colors.orange;
        break;
      case 'referido':
        icon = Icons.person_add_rounded;
        color = tpBlue;
        break;
      default:
        icon = Icons.notifications_active_rounded;
        color = Colors.grey;
    }

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: color.withOpacity(0.1), shape: BoxShape.circle),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  event['descripcion'] ?? 'Evento sin descripción',
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: tpBlue),
                ),
                Text(
                  timeStr,
                  style: const TextStyle(fontSize: 11, color: Colors.grey),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
