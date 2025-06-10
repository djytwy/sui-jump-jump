import * as blockies from 'blockies-ts'
import { renderSVGIcon } from '@codingwithmanny/blockies';

const address = `0x6f8c598bfc441b5b994cc8fb73be1ca08e12142a06e757c301267a629cd6dc48`
const imgSrc = blockies.create({ seed: address })
console.log(imgSrc);


(async () => {
    const svg = await renderSVGIcon({ seed: '0x6f8c598bfc441b5b994cc8fb73be1ca08e12142a06e757c301267a629cd6dc48' });
    console.log({ svg });
    // '<svg width="32" height="32" viewBox="0 0 32 32" fill="hsl(0,40%,0%)"...'
})();