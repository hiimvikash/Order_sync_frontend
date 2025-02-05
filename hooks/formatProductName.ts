export const formatProductName = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return [text, ''];
  
    const words = text.split(' ');
    let firstLine = '';
    let secondLine = '';
  
    for (let word of words) {
      if ((firstLine + word).length <= maxLength) {
        firstLine += (firstLine ? ' ' : '') + word;
      } else {
        secondLine += (secondLine ? ' ' : '') + word;
      }
    }
  
    return [firstLine, secondLine];
  };
  