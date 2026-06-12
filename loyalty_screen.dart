import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'loyalty_service.dart';

class LoyaltyScreen extends StatefulWidget {
  const LoyaltyScreen({super.key});

  @override
  State<LoyaltyScreen> createState() => _LoyaltyScreenState();
}

class _LoyaltyScreenState extends State<LoyaltyScreen> with SingleTickerProviderStateMixin {
  static const Color tpBlue = Color(0xFF1B4B72);
  static const Color tpRed = Color(0xFFE8253A);
  static const Color tpGold = Color(0xFFD4AF37); // Color para los puntos
  
  final String? uid = FirebaseAuth.instance.currentUser?.uid;
  final LoyaltyService _loyaltyService = LoyaltyService();
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
    if (uid == null) return const Scaffold(body: Center(child: Text("No autenticado")));

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text("Mis Puntos ToPaquete", style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: tpBlue,
        foregroundColor: Colors.white,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: tpGold,
          indicatorWeight: 4,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          tabs: const [
            Tab(text: "Resumen y Bonos"),
            Tab(text: "Catálogo de Canje"),
          ],
        ),
      ),
      body: StreamBuilder<DocumentSnapshot>(
        stream: FirebaseFirestore.instance.collection('users').doc(uid).snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: tpBlue));
          }
          
          final data = snapshot.data?.data() as Map<String, dynamic>? ?? {};
          final int puntos = data['puntosBalance'] ?? 0;
          final double kgMes = (data['kgMesActual'] ?? 0).toDouble();
          final int paqMes = data['paquetesMesActual'] ?? 0;

          return TabBarView(
            controller: _tabController,
            children: [
              _buildResumenTab(puntos, kgMes, paqMes),
              _buildCatalogoTab(puntos),
            ],
          );
        },
      ),
    );
  }

  // ==========================================
  // TAB 1: RESUMEN Y PROGRESO MENSUAL
  // ==========================================
  Widget _buildResumenTab(int puntos, double kgMes, int paqMes) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // TARJETA DE SALDO
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [tpBlue, Color(0xFF0F2C44)], begin: Alignment.topLeft, end: Alignment.bottomRight),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [BoxShadow(color: tpBlue.withOpacity(0.3), blurRadius: 15, offset: const Offset(0, 8))],
            ),
            child: Column(
              children: [
                const Text("SALDO DISPONIBLE", style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Icon(Icons.stars_rounded, color: tpGold, size: 40),
                    const SizedBox(width: 8),
                    Text(puntos.toString(), style: const TextStyle(color: Colors.white, fontSize: 48, fontWeight: FontWeight.black, height: 1)),
                    const SizedBox(width: 8),
                    const Padding(padding: EdgeInsets.only(bottom: 8), child: Text("pts", style: TextStyle(color: Colors.white70, fontSize: 18, fontWeight: FontWeight.bold))),
                  ],
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(color: Colors.white.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
                  child: Text("Equivale a ${(puntos / 100).toStringAsFixed(2)}€ en descuentos", style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500)),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 32),
          const Text("Tus Bonos de este Mes", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: tpBlue)),
          const SizedBox(height: 8),
          const Text("Completa las metas antes de fin de mes para ganar puntos extra.", style: TextStyle(color: Colors.grey, fontSize: 13)),
          const SizedBox(height: 20),

          // PROGRESO KILOS
          _buildProgressCard(
            title: "Bono por Volumen (Kilos)",
            icon: Icons.scale_rounded,
            color: Colors.teal,
            currentValue: kgMes,
            target1: 30,
            reward1: "+50 pts",
            target2: 80,
            reward2: "+150 pts",
            unit: "kg",
          ),
          const SizedBox(height: 16),

          // PROGRESO PAQUETES
          _buildProgressCard(
            title: "Bono por Frecuencia (Paquetes)",
            icon: Icons.inventory_2_rounded,
            color: Colors.blue.shade700,
            currentValue: paqMes.toDouble(),
            target1: 5,
            reward1: "+30 pts",
            target2: 15,
            reward2: "+80 pts",
            unit: "paq",
          ),
        ],
      ),
    );
  }

  Widget _buildProgressCard({
    required String title, required IconData icon, required Color color,
    required double currentValue, required double target1, required String reward1,
    required double target2, required String reward2, required String unit,
  }) {
    double progress = currentValue / target2;
    if (progress > 1.0) progress = 1.0;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.grey.shade200)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(12)), child: Icon(icon, color: color, size: 20)),
              const SizedBox(width: 12),
              Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: tpBlue)),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text("Llevas: ${currentValue.toInt()} $unit", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              Text("Meta: ${target2.toInt()} $unit", style: const TextStyle(color: Colors.grey, fontSize: 12, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 10,
              backgroundColor: Colors.grey.shade200,
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _buildMilestone(target1, reward1, currentValue >= target1, color)),
              const SizedBox(width: 12),
              Expanded(child: _buildMilestone(target2, reward2, currentValue >= target2, color)),
            ],
          )
        ],
      ),
    );
  }

  Widget _buildMilestone(double target, String reward, bool achieved, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
      decoration: BoxDecoration(
        color: achieved ? color.withOpacity(0.1) : Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: achieved ? color.withOpacity(0.3) : Colors.grey.shade200),
      ),
      child: Column(
        children: [
          Text("${target.toInt()}+", style: TextStyle(fontSize: 12, color: achieved ? color : Colors.grey, fontWeight: FontWeight.bold)),
          const SizedBox(height: 2),
          Text(reward, style: TextStyle(fontSize: 14, color: achieved ? color : Colors.grey.shade400, fontWeight: FontWeight.black)),
        ],
      ),
    );
  }

  // ==========================================
  // TAB 2: CATÁLOGO DE CANJE
  // ==========================================
  Widget _buildCatalogoTab(int currentPoints) {
    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: LoyaltyService.catalog.length,
      itemBuilder: (context, index) {
        final item = LoyaltyService.catalog[index];
        final bool canAfford = currentPoints >= item.cost;

        return Card(
          margin: const EdgeInsets.only(bottom: 16),
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: canAfford ? tpGold.withOpacity(0.5) : Colors.grey.shade200, width: canAfford ? 1.5 : 1),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 50, height: 50,
                  decoration: BoxDecoration(color: canAfford ? tpGold.withOpacity(0.1) : Colors.grey.shade100, shape: BoxShape.circle),
                  child: Icon(_getIconForType(item.type), color: canAfford ? tpGold : Colors.grey, size: 24),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item.title, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: canAfford ? tpBlue : Colors.grey)),
                      const SizedBox(height: 4),
                      Text(item.description, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text("${item.cost} pts", style: TextStyle(fontWeight: FontWeight.black, fontSize: 16, color: canAfford ? tpGold : Colors.grey)),
                    const SizedBox(height: 8),
                    ElevatedButton(
                      onPressed: canAfford ? () => _confirmRedeem(item) : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: tpBlue,
                        foregroundColor: Colors.white,
                        disabledBackgroundColor: Colors.grey.shade200,
                        disabledForegroundColor: Colors.grey,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
                        minimumSize: const Size(80, 32),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      child: const Text("CANJEAR", style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  IconData _getIconForType(String type) {
    switch (type) {
      case 'discount': return Icons.local_offer_rounded;
      case 'free_kg': return Icons.scale_rounded;
      case 'free_domicilio': return Icons.home_rounded;
      default: return Icons.star_rounded;
    }
  }

  void _confirmRedeem(RewardItem item) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text("Confirmar Canje", style: TextStyle(color: tpBlue, fontWeight: FontWeight.bold)),
        content: Text("¿Estás seguro que deseas canjear ${item.cost} puntos por:\n\n${item.title}?"),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text("Cancelar", style: TextStyle(color: Colors.grey))),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context); // Cerrar modal
              try {
                await _loyaltyService.redeemReward(uid!, item);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("¡Canje exitoso! Tienes un nuevo cupón disponible."), backgroundColor: Colors.green));
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: tpRed));
                }
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: tpGold, foregroundColor: Colors.white),
            child: const Text("Sí, Canjear"),
          ),
        ],
      ),
    );
  }
}
