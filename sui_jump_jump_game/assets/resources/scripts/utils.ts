export const showAddress = (address: string, showNumber?: number) => {
    const _showNumber = showNumber ?? 5
    return `${address.slice(0, _showNumber)}...${address.slice(address.length - _showNumber, address.length)}`
}