// ═══════════════════════════════════════════════════
// OCULOPS — Auth Component
// Login / Signup with email+password and magic link
// ═══════════════════════════════════════════════════

import { useState } from 'react'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import { signInWithEmail, signUpWithEmail, signInWithMagicLink } from '../lib/supabase'
import './Auth.css'

const cardVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: [0.23, 1, 0.32, 1],
            staggerChildren: 0.08
        }
    }
}

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { ease: 'easeOut', duration: 0.4 } }
}

const messageVariants = {
    initial: { opacity: 0, y: -10, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.2 } }
}

export default function Auth() {
    const [mode, setMode] = useState('login') // login | signup | magic
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(null)

        let result
        if (mode === 'login') {
            result = await signInWithEmail(email, password)
        } else if (mode === 'signup') {
            result = await signUpWithEmail(email, password, fullName)
            if (!result.error) {
                setSuccess('Cuenta creada. Revisa tu email para confirmar.')
                setLoading(false)
                return
            }
        } else if (mode === 'magic') {
            result = await signInWithMagicLink(email)
            if (!result.error) {
                setSuccess('Magic link enviado a tu email. Revisa tu bandeja.')
                setLoading(false)
                return
            }
        }

        if (result?.error) {
            setError(result.error.message)
        }
        setLoading(false)
    }

    const switchMode = (newMode) => {
        setMode(newMode);
        setError(null);
        setSuccess(null);
    }

    return (
        <div className="auth-page">
            <Motion.div
                className="auth-card"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
            >
                <Motion.div variants={itemVariants} className="auth-logo">
                    <div className="auth-logo-icon">OC</div>
                    <div>
                        <div className="auth-logo-text">OCULOPS</div>
                        <div className="auth-logo-version">OS v10</div>
                    </div>
                </Motion.div>

                <Motion.p variants={itemVariants} className="auth-subtitle">
                    Autonomous Growth Operating System
                </Motion.p>

                <AnimatePresence>
                    {error && (
                        <Motion.div
                            key="error"
                            className="auth-error"
                            variants={messageVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                        >
                            {error}
                        </Motion.div>
                    )}
                    {success && (
                        <Motion.div
                            key="success"
                            className="auth-success"
                            variants={messageVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                        >
                            {success}
                        </Motion.div>
                    )}
                </AnimatePresence>


                <Motion.form variants={itemVariants} className="auth-form" onSubmit={handleSubmit}>
                    {mode === 'signup' && (
                        <Motion.div variants={itemVariants} className="auth-field">
                            <label>Nombre completo</label>
                            <Motion.input
                                type="text"
                                placeholder="Roberto Ortega"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                whileFocus={{ borderColor: 'rgba(var(--accent-primary-rgb), 0.5)', boxShadow: '0 0 0 3px rgba(var(--accent-primary-rgb), 0.1)' }}
                            />
                        </Motion.div>
                    )}

                    <Motion.div variants={itemVariants} className="auth-field">
                        <label>Email</label>
                        <Motion.input
                            type="email"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            whileFocus={{ borderColor: 'rgba(var(--accent-primary-rgb), 0.5)', boxShadow: '0 0 0 3px rgba(var(--accent-primary-rgb), 0.1)' }}
                        />
                    </Motion.div>

                    {mode !== 'magic' && (
                        <Motion.div variants={itemVariants} className="auth-field">
                            <label>Contraseña</label>
                            <Motion.input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                whileFocus={{ borderColor: 'rgba(var(--accent-primary-rgb), 0.5)', boxShadow: '0 0 0 3px rgba(var(--accent-primary-rgb), 0.1)' }}
                            />
                        </Motion.div>
                    )}

                    <Motion.button
                        variants={itemVariants}
                        className="auth-submit"
                        type="submit"
                        disabled={loading}
                        whileHover={{ scale: 1.02, y: -2, boxShadow: 'var(--shadow-glow-lg), 0 4px 12px rgba(var(--accent-primary-rgb), 0.2)' }}
                        whileTap={{ scale: 0.98, y: 0 }}
                    >
                        {loading ? '⏳ Cargando...' : mode === 'login' ? '🚀 Entrar' : mode === 'signup' ? '✨ Crear cuenta' : '✉️ Enviar magic link'}
                    </Motion.button>
                </Motion.form>

                {mode !== 'magic' && (
                    <Motion.div variants={itemVariants}>
                        <div className="auth-divider">o</div>
                        <Motion.button
                            className="auth-magic-link"
                            onClick={() => switchMode('magic')}
                            disabled={loading}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            ✉️ Entrar con Magic Link
                        </Motion.button>
                    </Motion.div>
                )}

                <Motion.div variants={itemVariants} className="auth-toggle">
                    {mode === 'login' ? (
                        <>¿No tienes cuenta? <button onClick={() => switchMode('signup')}>Crear cuenta</button></>
                    ) : mode === 'signup' ? (
                        <>¿Ya tienes cuenta? <button onClick={() => switchMode('login')}>Iniciar sesión</button></>
                    ) : (
                        <button onClick={() => switchMode('login')}>← Volver a login</button>
                    )}
                </Motion.div>
            </Motion.div>
        </div>
    )
}
