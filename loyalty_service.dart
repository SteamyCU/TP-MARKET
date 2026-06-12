import 'package:cloud_firestore/cloud_firestore.dart';

class RewardItem {
  final String id;
  final String title;
  final String description;
  final int cost;
  final String type; // 'discount', 'free_kg', 'free_domicilio', 'special'
  final double? value;

  const RewardItem({
    required this.id,
    required this.title,
    required this.description,
    required this.cost,
    required this.type,
    this.value,
  });
}

class LoyaltyService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  // Catálogo Oficial de Canjes
  static const List<RewardItem> catalog = [
    RewardItem(id: 'desc_1', title: '1€ de descuento', description: 'En tu próximo envío', cost: 100, type: 'discount', value: 1.0),
    RewardItem(id: 'prioridad', title: 'Prioridad de proceso', description: 'Cola prioritaria este mes', cost: 150, type: 'special'),
    RewardItem(id: 'kg_1', title: '1 kg gratis', description: 'En tu próximo paquete', cost: 200, type: 'free_kg', value: 1.0),
    RewardItem(id: 'desc_3', title: '3€ de descuento', description: 'Ideal para paquetes pequeños', cost: 280, type: 'discount', value: 3.0),
    RewardItem(id: 'doble_pts', title: 'Doble puntos', description: 'Multiplica x2 en tu próximo envío', cost: 300, type: 'special'),
    RewardItem(id: 'dom_1', title: 'Domicilio gratis', description: 'Ahorra 5€ en la entrega', cost: 450, type: 'free_domicilio', value: 1.0),
    RewardItem(id: 'envio_base', title: 'Envío base gratis', description: 'Ahorra los 7,50€ base', cost: 700, type: 'discount', value: 7.50),
    RewardItem(id: 'dom_2', title: '2 Domicilios gratis', description: 'Para envíos múltiples', cost: 850, type: 'free_domicilio', value: 2.0),
    RewardItem(id: 'kg_5', title: '5 kg gratis', description: 'Para clientes de alto volumen', cost: 900, type: 'free_kg', value: 5.0),
  ];

  // Cálculo de puntos para un paquete (Simulación para mostrar al cliente)
  int calculatePointsPreview(double kg, bool hasDomicilio) {
    int ptsKg = (kg * 5).toInt();
    int ptsPaq = 10;
    int ptsDom = hasDomicilio ? 50 : 0;
    return ptsKg + ptsPaq + ptsDom;
  }

  // Canjear un premio
  Future<void> redeemReward(String uid, RewardItem reward) async {
    final userRef = _db.collection('users').doc(uid);
    
    await _db.runTransaction((transaction) async {
      final snapshot = await transaction.get(userRef);
      if (!snapshot.exists) throw Exception("Usuario no encontrado");

      final currentPoints = snapshot.data()?['puntosBalance'] ?? 0;
      
      if (currentPoints < reward.cost) {
        throw Exception("Puntos insuficientes");
      }

      // 1. Restar puntos
      transaction.update(userRef, {
        'puntosBalance': currentPoints - reward.cost,
      });

      // 2. Guardar el voucher/cupón en la subcolección del usuario
      final voucherRef = userRef.collection('recompensas_activas').doc();
      transaction.set(voucherRef, {
        'reward_id': reward.id,
        'title': reward.title,
        'type': reward.type,
        'value': reward.value,
        'cost': reward.cost,
        'usado': false,
        'fecha_canje': FieldValue.serverTimestamp(),
      });

      // 3. Registrar en el historial
      final historyRef = userRef.collection('historial_puntos').doc();
      transaction.set(historyRef, {
        'tipo': 'canje',
        'puntos': -reward.cost,
        'descripcion': 'Canje: ${reward.title}',
        'fecha': FieldValue.serverTimestamp(),
      });
    });
  }
}
