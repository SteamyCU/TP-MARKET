import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class RegistrationScreen extends StatefulWidget {
  final String? initialRefCode;

  const RegistrationScreen({super.key, this.initialRefCode});

  @override
  State<RegistrationScreen> createState() => _RegistrationScreenState();
}

class _RegistrationScreenState extends State<RegistrationScreen> {
  final _formKey = GlobalKey<FormState>();
  final PageController _pageController = PageController();
  int _currentStep = 0;

  // Colors
  static const Color tpBlue = Color(0xFF1B4B72);
  static const Color tpRed = Color(0xFFE8253A);

  // Controllers
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _referralController = TextEditingController();

  bool _isLoading = false;
  bool _isValidatingCode = false;
  Map<String, dynamic>? _appliedBeneficio;
  String? _referralMessage;
  bool _isCodeValid = false;

  @override
  void initState() {
    super.initState();
    if (widget.initialRefCode != null) {
      _referralController.text = widget.initialRefCode!;
      _validateReferralCode(widget.initialRefCode!);
    }
  }

  Future<void> _validateReferralCode(String code) async {
    if (code.isEmpty) return;
    
    setState(() {
      _isValidatingCode = true;
      _referralMessage = null;
      _isCodeValid = false;
    });

    try {
      final snapshot = await FirebaseFirestore.instance
          .collection('influencers')
          .where('codigo', isEqualTo: code.toUpperCase())
          .get();

      if (snapshot.docs.isEmpty) {
        setState(() {
          _referralMessage = "❌ Código no encontrado";
          _isCodeValid = false;
        });
      } else {
        final data = snapshot.docs.first.data();
        if (data['activo'] == false) {
          setState(() {
            _referralMessage = "Este código no está disponible";
            _isCodeValid = false;
          });
        } else {
          setState(() {
            _appliedBeneficio = data['beneficio'] ?? {'tipo': 'descuento', 'valor': 5};
            _referralMessage = "✅ Código ${code.toUpperCase()} aplicado — Obtienes ${_appliedBeneficio!['valor']}${_appliedBeneficio!['tipo'] == 'descuento' ? '€' : '%'} de beneficio";
            _isCodeValid = true;
          });
        }
      }
    } catch (e) {
      setState(() {
        _referralMessage = "Error al validar el código";
      });
    } finally {
      setState(() => _isValidatingCode = false);
    }
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      // 1. Create Auth User
      final userCredential = await FirebaseAuth.instance.createUserWithEmailAndPassword(
        email: _emailController.text.trim(),
        password: _passwordController.text.trim(),
      );

      final uid = userCredential.user!.uid;

      // 2. Save to clientes/{uid}
      await FirebaseFirestore.instance.collection('clientes').doc(uid).set({
        'nombre': _nameController.text.trim(),
        'email': _emailController.text.trim(),
        'telefono': _phoneController.text.trim(),
        'referido_por': _isCodeValid ? _referralController.text.toUpperCase() : null,
        'beneficio_aplicado': _appliedBeneficio,
        'beneficio_usado': false,
        'createdAt': FieldValue.serverTimestamp(),
      });

      // 3. Update Influencer if applicable
      if (_isCodeValid) {
        final influencerSnapshot = await FirebaseFirestore.instance
            .collection('influencers')
            .where('codigo', isEqualTo: _referralController.text.toUpperCase())
            .get();

        if (influencerSnapshot.docs.isNotEmpty) {
          final influencerDoc = influencerSnapshot.docs.first;
          
          // Increment total_referidos
          await influencerDoc.reference.update({
            'total_referidos': FieldValue.increment(1),
          });

          // Add to subcollection referidos
          await influencerDoc.reference.collection('referidos').add({
            'cliente_uid': uid,
            'fecha': FieldValue.serverTimestamp(),
            'estado': 'registrado',
          });
        }
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("¡Registro completado con éxito!")),
        );
        Navigator.of(context).pop(); // Or navigate to home
      }
    } on FirebaseAuthException catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message ?? "Error en el registro")),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Error inesperado")),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Registro ToPaquete", style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: tpBlue,
        foregroundColor: Colors.white,
      ),
      body: Form(
        key: _formKey,
        child: PageView(
          controller: _pageController,
          physics: const NeverScrollableScrollPhysics(),
          children: [
            _buildPersonalDataStep(),
            _buildAuthStep(),
            _buildReferralStep(),
          ],
        ),
      ),
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  Widget _buildPersonalDataStep() {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Datos Personales", style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: tpBlue)),
          const SizedBox(height: 24),
          TextFormField(
            controller: _nameController,
            decoration: _inputDecoration("Nombre completo", Icons.person),
            validator: (v) => v!.isEmpty ? "Campo requerido" : null,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            decoration: _inputDecoration("Teléfono", Icons.phone),
            validator: (v) => v!.isEmpty ? "Campo requerido" : null,
          ),
        ],
      ),
    );
  }

  Widget _buildAuthStep() {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Seguridad", style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: tpBlue)),
          const SizedBox(height: 24),
          TextFormField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            decoration: _inputDecoration("Email", Icons.email),
            validator: (v) => v!.contains("@") ? null : "Email inválido",
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _passwordController,
            obscureText: true,
            decoration: _inputDecoration("Contraseña", Icons.lock),
            validator: (v) => v!.length >= 6 ? null : "Mínimo 6 caracteres",
          ),
        ],
      ),
    );
  }

  Widget _buildReferralStep() {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Beneficios", style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: tpBlue)),
          const SizedBox(height: 8),
          const Text(
            "¿Tienes un código de descuento o fuiste referido?",
            style: TextStyle(color: Colors.grey, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _referralController,
                  textCapitalization: TextCapitalization.characters,
                  decoration: _inputDecoration("Ej: MARIA20", Icons.star_border),
                ),
              ),
              const SizedBox(width: 12),
              ElevatedButton(
                onPressed: _isValidatingCode ? null : () => _validateReferralCode(_referralController.text),
                style: ElevatedButton.styleFrom(
                  backgroundColor: tpBlue,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _isValidatingCode 
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text("APLICAR"),
              ),
            ],
          ),
          if (_referralMessage != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: _isCodeValid ? Colors.green.shade50 : Colors.red.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: _isCodeValid ? Colors.green.shade100 : Colors.red.shade100),
              ),
              child: Row(
                children: [
                  Icon(
                    _isCodeValid ? Icons.check_circle : Icons.error,
                    color: _isCodeValid ? Colors.green : tpRed,
                    size: 20,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      _referralMessage!,
                      style: TextStyle(
                        color: _isCodeValid ? Colors.green.shade800 : tpRed,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          if (widget.initialRefCode != null && !_isCodeValid && !_isValidatingCode)
            const Padding(
              padding: EdgeInsets.only(top: 8, left: 4),
              child: Text(
                "Llegaste referido por un creador de contenido",
                style: TextStyle(fontSize: 12, color: Colors.grey, fontStyle: FontStyle.italic),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildBottomNav() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5))],
      ),
      child: Row(
        children: [
          if (_currentStep > 0)
            Expanded(
              child: OutlinedButton(
                onPressed: () => setState(() {
                  _currentStep--;
                  _pageController.animateToPage(_currentStep, duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
                }),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  side: const BorderSide(color: tpBlue),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: const Text("ATRÁS", style: TextStyle(color: tpBlue, fontWeight: FontWeight.bold)),
              ),
            ),
          if (_currentStep > 0) const SizedBox(width: 16),
          Expanded(
            flex: 2,
            child: ElevatedButton(
              onPressed: _isLoading ? null : () {
                if (_currentStep < 2) {
                  setState(() {
                    _currentStep++;
                    _pageController.animateToPage(_currentStep, duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
                  });
                } else {
                  _register();
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: tpBlue,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                elevation: 0,
              ),
              child: _isLoading 
                ? const CircularProgressIndicator(color: Colors.white)
                : Text(_currentStep < 2 ? "CONTINUAR" : "FINALIZAR REGISTRO", style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  InputDecoration _inputDecoration(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon, color: tpBlue.withOpacity(0.5)),
      filled: true,
      fillColor: Colors.grey.shade50,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade200)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: tpBlue, width: 2)),
      labelStyle: const TextStyle(fontWeight: FontWeight.bold, color: Colors.grey),
    );
  }
}
