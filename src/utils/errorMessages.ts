export const getErrorMessage = (error: unknown): string => {
    if (!error) {
        return 'Ocurrió un error. Intenta de nuevo.'
    }

    if (typeof error === 'object' && 'response' in error) {
        const axiosError = error as any
        const status = axiosError.response?.status
        const backendMessage = axiosError.response?.data?.message

        if (backendMessage && typeof backendMessage === 'string' && backendMessage.length < 200) {
            return backendMessage
        }

        switch (status) {
            case 400:
                return 'Los datos enviados no son válidos. Verifica la información.'
            case 401:
                return 'Correo o contraseña incorrectos.'
            case 403:
                return 'No tienes permiso para hacer esto.'
            case 404:
                return 'No encontramos lo que buscas.'
            case 409:
                return 'Ya existe un registro con estos datos.'
            case 423:
                return 'Cuenta bloqueada temporalmente. Espera 15 minutos.'
            case 429:
                return 'Demasiadas solicitudes. Espera un momento e intenta de nuevo.'
            case 500:
                return 'Algo salió mal en el servidor. Intenta de nuevo en unos momentos.'
            case 503:
                return 'El servicio no está disponible ahora. Intenta de nuevo en unos segundos.'
            default:
                if (status && status >= 500) {
                    return 'Error del servidor. Intenta de nuevo en unos momentos.'
                }
                return 'Ocurrió un error. Intenta de nuevo.'
        }
    }

    if (typeof error === 'object' && 'message' in error) {
        const msg = (error as Error).message
        if (msg.includes('Network Error') || msg.includes('timeout') || msg.includes('ECONNREFUSED')) {
            return 'Sin conexión al servidor. Verifica tu internet e intenta de nuevo.'
        }
    }

    return 'Ocurrió un error inesperado. Intenta de nuevo.'
}
