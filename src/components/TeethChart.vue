<script setup lang="ts">
interface ToothData {
  condition: string;
  concern: boolean;
  notes?: string[];
}

const props = defineProps<{
  teeth: Record<number, ToothData>;
  type?: 'permanent' | 'deciduous';
}>();

const emit = defineEmits<{
  (e: 'tooth-click', iso: number): void;
}>();

function conditionToColor(c: string): string {
  if (c === 'compromised') {
    return '#FFCDD2';
  } else if (c === 'endo') {
    return '#D1C4E9';
  } else if (c === 'filled') {
    return '#FFE082';
  } else if (c === 'missing') {
    return '#BDBDBD';
  } else if (c === 'rotated') {
    return '#B2EBF2';
  } else if (c === 'gum-recessed') {
    return '#F48FB1';
  } else if (c === 'displaced') {
    return '#b2dfdb';
  } else {
    return 'transparent';
  }
}
</script>

<template>
  <!-- Deciduous (Primary) chart -->
  <svg v-if="props.type === 'deciduous'"
    width="100%"
    style="max-height:360px;display:block;margin:0 auto"
    version="1.1"
    preserveAspectRatio="xMidYMid meet"
    viewBox="0 0 560 640"
  >
    <defs>
      <!-- Q5: upper-right 51-55 -->
      <path style="cursor:pointer" d="M283.67 25.03C277.49 12.12 210.6 22.81 215.36 37.87C223.67 64.15 243.24 89.77 265.55 83.89C285.4 78.66 280.04 36.81 283.67 25.03Z" id="diso-51" />
      <path style="cursor:pointer" d="M268.14 35.87C256.58 30.99 244.5 32.69 231.56 42.92" id="da3GVDWJbDP" />
      <path style="cursor:pointer" d="M162.99 78.92C155.44 56.79 208.53 29.4 217.53 48.83C223.45 61.63 222.12 95.6 209.45 102.66C195.11 110.66 168.26 94.34 162.99 78.92Z" id="diso-52" />
      <path style="cursor:pointer" d="M203.98 57.36C195.15 57.99 187.9 57.2 177.49 70.46" id="dc1vrzH7GD" />
      <path style="cursor:pointer" d="M167.61 91.64C160 85.76 147.33 87.27 138.76 91.64C129.14 96.55 122.74 107.49 119.75 117.87C117.02 127.34 121.8 149.48 131.55 148.03C152.21 144.97 173.61 155.55 179.41 136.89C184.52 120.47 179.94 101.17 167.61 91.64Z" id="diso-53" />
      <path style="cursor:pointer" d="M154.74 98.87C134.65 102.43 131.01 118.38 129.96 129.93" id="db2KyfohhGJ" />
      <path style="cursor:pointer" d="M160.25 299.21C153.08 319.08 132.59 330.79 109.93 326.07C90.3 321.98 77.77 311.21 73.16 284.63C68.83 259.7 65.64 230.04 110.26 230.03C152.64 230.02 175.8 256.19 160.25 299.21Z" id="diso-55" />
      <path style="cursor:pointer" d="M140.24 246.95C133.89 249.1 122.94 247.7 121.5 254.77C121.31 255.71 119.77 263.24 119.58 264.19C123.56 267.1 130.76 263.92 136.55 263.41C136.52 263.84 117.33 270.52 117.17 270.59C115.25 271.46 110.5 284.98 114.91 291.31C123.18 296.49 132.35 292.13 140.91 292.27C132.74 293.97 121.04 295.45 120.29 297.59C118.96 304.68 117.73 310.3 116.49 315.83C116.5 309.53 117.82 302.85 113.51 297.78C102.66 295.08 102.28 296.93 96.62 297.37C102.1 295.51 105.39 290.93 107.52 284.91C109.52 276.83 107.69 276.44 106.81 274.14C100.84 271.96 97.65 275.37 93.18 275.71C98.97 273.14 105.77 269.9 110.67 266.04C116.38 261.54 109.25 255.86 104.15 250.75C110.81 249.27 117.83 249.45 122.46 238.74C123.72 246.83 132.52 245.46 140.24 246.95Z" id="da882cHHUnK" />
      <path style="cursor:pointer" d="M106.01 151.25C106.01 151.25 93.48 151.89 87.76 169.07C85.97 174.45 93.87 183.09 91.29 189.25C86.15 201.51 89.38 219.48 99.74 224.3C106.99 227.67 119.41 226.45 125.39 226.5C141.57 226.65 151.59 219.29 159.5 209.78C169.41 197.85 166.37 177.65 157.41 164.39C146.36 155.88 120.62 153.92 106.01 151.25Z" id="diso-54" />
      <path style="cursor:pointer" d="M130.51 183.51C133.62 186.21 140.69 182.49 145.71 181.43C144.22 182.4 132.32 190.23 130.83 191.2C125.18 199.54 127.13 206.71 126.18 214.71C122.69 213.71 119.33 217.46 115.99 221.85C116.97 217.17 122.12 210.23 117.72 208.45C116.98 208.75 113.3 210.22 106.68 212.88C113.62 207.23 117.47 204.1 118.24 203.47C118.24 203.47 121.47 196.48 118.96 197.5C116.45 198.53 105.08 195.27 105.08 195.27C105.08 195.27 116.83 196.57 121.65 190.91C126.47 185.25 126.7 181.74 127.47 177.82C128.25 173.9 127.84 169.96 130.05 167.14C131.99 164.64 138.23 163.16 138.23 163.16C134.35 170.11 131.23 176.96 130.51 183.51Z" id="dcwHRvgNcf" />
      <!-- text labels Q5 -->
      <text id="dc1Am1SRnuf" x="241.89" y="100.29" font-size="20" transform="matrix(1 0 0 1 9.499999999999972 -13.818655303030482)"><tspan x="241.89" dy="0em" dominant-baseline="text-before-edge" :stroke="props.teeth[51]?.concern ? 'red' : undefined">51</tspan></text>
      <text id="da1wTSzo241" x="241.89" y="100.29" font-size="20" transform="matrix(1 0 0 1 -27.54545454545476 -3.3489583333335986)"><tspan x="241.89" dy="0em" dominant-baseline="text-before-edge" :stroke="props.teeth[52]?.concern ? 'red' : undefined">52</tspan></text>
      <text id="ddngiuIzIj" x="241.89" y="100.29" font-size="20" transform="matrix(1 0 0 1 -60.114216486779355 29.63351517487976)"><tspan x="241.89" dy="0em" dominant-baseline="text-before-edge" :stroke="props.teeth[53]?.concern ? 'red' : undefined">53</tspan></text>
      <text id="daPscZuMW" x="241.89" y="100.29" font-size="20" transform="matrix(1 0 0 1 -71.54390398677936 81.17930349069081)"><tspan x="241.89" dy="0em" dominant-baseline="text-before-edge" :stroke="props.teeth[54]?.concern ? 'red' : undefined">54</tspan></text>
      <text id="devESRjLHU" x="241.89" y="100.29" font-size="20" transform="matrix(1 0 0 1 -73.54390398677938 163.84957592658844)"><tspan x="241.89" dy="0em" dominant-baseline="text-before-edge" :stroke="props.teeth[55]?.concern ? 'red' : undefined">55</tspan></text>
      <!-- Q6: upper-left 61-65 -->
      <path style="cursor:pointer" d="M310.94 25.03C317.11 12.12 384.01 22.81 379.24 37.87C370.93 64.15 351.36 89.77 329.06 83.89C309.21 78.66 314.56 36.81 310.94 25.03Z" id="diso-61" />
      <path style="cursor:pointer" d="M326.46 35.87C338.02 30.99 350.11 32.69 363.05 42.92" id="dh1eFc4drSD" />
      <path style="cursor:pointer" d="M431.61 78.92C439.17 56.79 386.08 29.4 377.08 48.83C371.15 61.63 372.49 95.6 385.15 102.66C399.5 110.66 426.35 94.34 431.61 78.92Z" id="diso-62" />
      <path style="cursor:pointer" d="M390.63 57.36C399.45 57.99 406.71 57.2 417.12 70.46" id="df8TlGPwTJ" />
      <path style="cursor:pointer" d="M426.99 91.64C434.6 85.76 447.28 87.27 455.84 91.64C465.46 96.55 471.87 107.49 474.86 117.87C477.59 127.34 472.81 149.48 463.06 148.03C442.39 144.97 421 155.55 415.19 136.89C410.09 120.47 414.66 101.17 426.99 91.64Z" id="diso-63" />
      <path style="cursor:pointer" d="M439.87 98.87C459.96 102.43 463.6 118.38 464.65 129.93" id="da4D4emNiDi" />
      <path style="cursor:pointer" d="M430.01 299.21C437.19 319.08 457.68 330.79 480.34 326.07C499.97 321.98 512.5 311.21 517.11 284.63C521.44 259.7 524.62 230.04 480.01 230.03C437.63 230.02 414.47 256.19 430.01 299.21Z" id="diso-65" />
      <path style="cursor:pointer" d="M450.03 246.95C456.38 249.1 467.33 247.7 468.77 254.77C468.96 255.71 470.49 263.24 470.69 264.19C466.71 267.1 459.51 263.92 453.72 263.41C453.75 263.84 472.94 270.52 473.1 270.59C475.02 271.46 479.77 284.98 475.35 291.31C467.09 296.49 457.92 292.13 449.36 292.27C457.53 293.97 469.23 295.45 469.98 297.59C471.3 304.68 472.54 310.3 473.78 315.83C473.77 309.53 472.45 302.85 476.76 297.78C487.61 295.08 487.99 296.93 493.65 297.37C488.17 295.51 484.88 290.93 482.75 284.91C480.75 276.83 482.58 276.44 483.46 274.14C489.43 271.96 492.62 275.37 497.09 275.71C491.3 273.14 484.5 269.9 479.59 266.04C473.89 261.54 481.02 255.86 486.12 250.75C479.46 249.27 472.44 249.45 467.81 238.74C466.55 246.83 457.75 245.46 450.03 246.95Z" id="dd9AQUN9l" />
      <path style="cursor:pointer" d="M484.26 151.25C484.26 151.25 496.79 151.89 502.51 169.07C504.29 174.45 496.4 183.09 498.98 189.25C504.12 201.51 500.89 219.48 490.53 224.3C483.28 227.67 470.86 226.45 464.88 226.5C448.7 226.65 438.68 219.29 430.77 209.78C420.86 197.85 423.9 177.65 432.86 164.39C443.91 155.88 469.65 153.92 484.26 151.25Z" id="diso-64" />
      <path style="cursor:pointer" d="M459.76 183.51C456.65 186.21 449.57 182.49 444.56 181.43C446.05 182.4 457.95 190.23 459.44 191.2C465.09 199.54 463.14 206.71 464.08 214.71C467.58 213.71 470.93 217.46 474.28 221.85C473.3 217.17 468.14 210.23 472.55 208.45C473.29 208.75 476.97 210.22 483.59 212.88C476.65 207.23 472.8 204.1 472.03 203.47C472.03 203.47 468.8 196.48 471.31 197.5C473.82 198.53 485.19 195.27 485.19 195.27C485.19 195.27 473.44 196.57 468.62 190.91C463.8 185.25 463.57 181.74 462.8 177.82C462.02 173.9 462.43 169.96 460.22 167.14C458.27 164.64 452.04 163.16 452.04 163.16C455.92 170.11 459.04 176.96 459.76 183.51Z" id="dg9i5HslOD" />
      <!-- text labels Q6 -->
      <text id="da3vLld1187" x="241.89" y="100.29" font-size="20" transform="matrix(1 0 0 1 80.0303030303032 -16.8489583333336)"><tspan x="241.89" dy="0em" dominant-baseline="text-before-edge" :stroke="props.teeth[61]?.concern ? 'red' : undefined">61</tspan></text>
      <text id="dd8C077TiQe" x="241.89" y="100.29" font-size="20" transform="matrix(0.9999643816274039 -0.00844011116774232 0.00844011116774232 0.9999643816274039 118.8765401877632 3.6746787627775532)"><tspan x="241.89" dy="0em" dominant-baseline="text-before-edge" :stroke="props.teeth[62]?.concern ? 'red' : undefined">62</tspan></text>
      <text id="da3dsbSynl2" x="241.89" y="100.29" font-size="20" transform="matrix(1 0 0 1 147.53030303030368 32.74195075757564)"><tspan x="241.89" dy="0em" dominant-baseline="text-before-edge" :stroke="props.teeth[63]?.concern ? 'red' : undefined">63</tspan></text>
      <text id="dc3i2cqy5i8" x="241.89" y="100.29" font-size="20" transform="matrix(1 0 0 1 154.65196824741906 71.6076251690125)"><tspan x="241.89" dy="0em" dominant-baseline="text-before-edge" :stroke="props.teeth[64]?.concern ? 'red' : undefined">64</tspan></text>
      <text id="dc2Gq2EB8T" x="241.89" y="100.29" font-size="20" transform="matrix(1 0 0 1 154.651968247419 163.84957592658844)"><tspan x="241.89" dy="0em" dominant-baseline="text-before-edge" :stroke="props.teeth[65]?.concern ? 'red' : undefined">65</tspan></text>
      <!-- Q8: lower-left 81-85 -->
      <path style="cursor:pointer" d="M279.53 622.47C276.07 633.75 231.24 627.41 233.67 614.36C237.9 591.57 249.62 568.89 264.68 572.98C278.08 576.62 276.56 612.57 279.53 622.47Z" id="diso-81" />
      <path style="cursor:pointer" d="M268.73 613.87C261.31 618.51 253.22 617.56 244.15 609.37" id="dbaO5m8gAJ" />
      <path style="cursor:pointer" d="M176.01 582.48C170.09 605.02 222.03 629.2 229.47 609.27C234.38 596.14 231.19 562.31 218.76 556.01C204.69 548.89 180.13 566.77 176.01 582.48Z" id="diso-82" />
      <path style="cursor:pointer" d="M216.13 601.56C207.72 601.46 200.88 602.68 190.24 590.06" id="db1OuMQtEP6" />
      <path style="cursor:pointer" d="M181.67 570C174.78 576.32 162.66 575.57 154.29 571.72C144.88 567.39 138.18 556.85 134.75 546.67C131.63 537.38 134.91 515 144.25 515.86C164.03 517.69 183.74 505.85 190.31 524.14C196.08 540.22 192.84 559.75 181.67 570Z" id="diso-83" />
      <path style="cursor:pointer" d="M169.04 563.56C149.77 561.2 145.41 545.49 143.76 534.03" id="db2roP7vEXi" />
      <path style="cursor:pointer" d="M161.75 365.13C153.81 345.73 133.7 335.25 112.46 341.31C94.06 346.56 82.78 358.06 79.91 384.87C77.21 410.02 75.86 439.81 118.21 437.16C158.44 434.65 178.94 407.15 161.75 365.13Z" id="diso-85" />
      <path style="cursor:pointer" d="M145.71 418.49C139.56 416.72 129.24 418.77 127.48 411.8C127.24 410.87 125.36 403.44 125.13 402.51C128.74 399.37 135.75 402.12 141.27 402.27C141.22 401.85 122.63 396.32 122.47 396.26C120.6 395.51 115.33 382.29 119.16 375.71C126.71 370.05 135.66 373.86 143.78 373.21C135.93 372 124.74 371.22 123.91 369.13C122.25 362.13 120.75 356.59 119.27 351.14C119.63 357.43 121.27 364.02 117.46 369.34C107.31 372.69 106.85 370.86 101.45 370.76C106.76 372.29 110.14 376.66 112.5 382.54C114.86 390.49 113.14 390.99 112.44 393.33C106.89 395.87 103.67 392.66 99.41 392.58C105.06 394.8 111.69 397.63 116.57 401.2C122.24 405.34 115.79 411.44 111.24 416.84C117.64 417.92 124.3 417.32 129.3 427.74C130.03 419.59 138.46 420.44 145.71 418.49Z" id="davxQ9BjFX" />
      <path style="cursor:pointer" d="M118.64 516.06C118.64 516.06 106.71 516.17 100.31 499.36C98.31 494.09 105.31 485 102.51 479C96.94 467.07 98.99 448.94 108.55 443.51C115.24 439.71 127.1 440.19 132.77 439.78C148.12 438.68 158.04 445.42 166.09 454.45C176.18 465.76 174.44 486.11 166.69 499.88C156.67 509.03 132.35 512.52 118.64 516.06Z" id="diso-84" />
      <path style="cursor:pointer" d="M140.06 482.4C142.87 479.52 149.79 482.81 154.61 483.57C153.14 482.68 141.41 475.58 139.94 474.7C134.1 466.71 135.54 459.43 134.19 451.51C130.94 452.71 127.54 449.17 124.12 444.99C125.31 449.6 130.59 456.22 126.51 458.26C125.8 458.01 122.22 456.75 115.78 454.49C122.69 459.72 126.53 462.62 127.29 463.2C127.29 463.2 130.76 469.99 128.31 469.11C125.87 468.24 115.26 472.17 115.26 472.17C115.26 472.17 126.35 470.17 131.24 475.53C136.13 480.9 136.55 484.39 137.51 488.26C138.46 492.12 138.3 496.08 140.56 498.77C142.54 501.14 148.55 502.25 148.55 502.25C144.47 495.55 141.12 488.89 140.06 482.4Z" id="da5EcJWHaOD" />
      <!-- text labels Q8 -->
      <text id="da1jKNA7rAN" x="241.89" y="100.29" font-size="20" transform="matrix(1 0 0 1 9.128496503496507 445.10453088578424)"><tspan x="241.89" dy="0em" dominant-baseline="text-before-edge" :stroke="props.teeth[81]?.concern ? 'red' : undefined">81</tspan></text>
      <text id="daAHeijBe5" x="241.89" y="100.29" font-size="20" transform="matrix(1 0 0 1 -25.137128496503493 430.50453088578445)"><tspan x="241.89" dy="0em" dominant-baseline="text-before-edge" :stroke="props.teeth[82]?.concern ? 'red' : undefined">82</tspan></text>
      <text id="dek5cw6Hgp" x="241.89" y="100.29" font-size="20" transform="matrix(1 0 0 1 -53.026333041958225 396.11494755245076)"><tspan x="241.89" dy="0em" dominant-baseline="text-before-edge" :stroke="props.teeth[83]?.concern ? 'red' : undefined">83</tspan></text>
      <text id="dg2rNJx6rxS" x="241.89" y="100.29" font-size="20" transform="matrix(1 0 0 1 -66.3451977036963 352.9505417835022)"><tspan x="241.89" dy="0em" dominant-baseline="text-before-edge" :stroke="props.teeth[84]?.concern ? 'red' : undefined">84</tspan></text>
      <text id="dd14UMdDj6N" x="241.89" y="100.29" font-size="20" transform="matrix(1 0 0 1 -71.62851406792367 265.32019716321423)"><tspan x="241.89" dy="0em" dominant-baseline="text-before-edge" :stroke="props.teeth[85]?.concern ? 'red' : undefined">85</tspan></text>
      <!-- Q7: lower-right 71-75 -->
      <path style="cursor:pointer" d="M309.33 622.47C312.79 633.75 357.62 627.41 355.2 614.36C350.96 591.57 339.24 568.89 324.18 572.98C310.78 576.62 312.3 612.57 309.33 622.47Z" id="diso-71" />
      <path style="cursor:pointer" d="M320.14 613.87C327.56 618.51 335.65 617.56 344.71 609.37" id="df1SexwZEcq" />
      <path style="cursor:pointer" d="M412.85 582.48C418.77 605.02 366.83 629.2 359.39 609.27C354.49 596.14 357.68 562.31 370.1 556.01C384.17 548.89 408.73 566.77 412.85 582.48Z" id="diso-72" />
      <path style="cursor:pointer" d="M372.73 601.56C381.14 601.46 387.98 602.68 398.62 590.06" id="db9tcVaTZ" />
      <path style="cursor:pointer" d="M407.19 570C414.08 576.32 426.2 575.57 434.58 571.72C443.98 567.39 450.69 556.85 454.11 546.67C457.23 537.38 453.95 515 444.62 515.86C424.83 517.69 405.12 505.85 398.55 524.14C392.78 540.22 396.03 559.75 407.19 570Z" id="diso-73" />
      <path style="cursor:pointer" d="M419.82 563.56C439.09 561.2 443.45 545.49 445.1 534.03" id="dhdg0tmh2L" />
      <path style="cursor:pointer" d="M427.56 365.13C435.5 345.73 455.61 335.25 476.85 341.31C495.25 346.56 506.53 358.06 509.4 384.87C512.1 410.02 513.45 439.81 471.1 437.16C430.87 434.65 410.37 407.15 427.56 365.13Z" id="diso-75" />
      <path style="cursor:pointer" d="M443.6 418.49C449.75 416.72 460.06 418.77 461.83 411.8C462.06 410.87 463.95 403.44 464.18 402.51C460.57 399.37 453.56 402.12 448.04 402.27C448.09 401.85 466.68 396.32 466.84 396.26C468.7 395.51 473.98 382.29 470.15 375.71C462.6 370.05 453.65 373.86 445.53 373.21C453.38 372 464.57 371.22 465.4 369.13C467.06 362.13 468.56 356.59 470.04 351.14C469.68 357.43 468.04 364.02 471.85 369.34C481.99 372.69 482.46 370.86 487.86 370.76C482.55 372.29 479.17 376.66 476.81 382.54C474.45 390.49 476.17 390.99 476.87 393.33C482.41 395.87 485.64 392.66 489.9 392.58C484.25 394.8 477.62 397.63 472.74 401.2C467.07 405.34 473.52 411.44 478.07 416.84C471.67 417.92 465.01 417.32 460.01 427.74C459.28 419.59 450.84 420.44 443.6 418.49Z" id="dh46WoT2rhW" />
      <path style="cursor:pointer" d="M470.67 516.06C470.67 516.06 482.6 516.17 489 499.36C491 494.09 483.99 485 486.8 479C492.37 467.07 490.32 448.94 480.76 443.51C474.06 439.71 462.21 440.19 456.53 439.78C441.19 438.68 431.26 445.42 423.22 454.45C413.13 465.76 414.87 486.11 422.62 499.88C432.64 509.03 456.96 512.52 470.67 516.06Z" id="diso-74" />
      <path style="cursor:pointer" d="M449.24 482.4C446.44 479.52 439.52 482.81 434.7 483.57C436.17 482.68 447.9 475.58 449.37 474.7C455.21 466.71 453.76 459.43 455.11 451.51C458.37 452.71 461.77 449.17 465.19 444.99C464 449.6 458.71 456.22 462.8 458.26C463.51 458.01 467.09 456.75 473.53 454.49C466.62 459.72 462.78 462.62 462.02 463.2C462.02 463.2 458.55 469.99 461 469.11C463.44 468.24 474.05 472.17 474.05 472.17C474.05 472.17 462.96 470.17 458.07 475.53C453.18 480.9 452.76 484.39 451.8 488.26C450.84 492.12 451.01 496.08 448.75 498.77C446.76 501.14 440.76 502.25 440.76 502.25C444.84 495.55 448.19 488.89 449.24 482.4Z" id="da4VwzCcbws" />
      <!-- text labels Q7 -->
      <text id="da253G7JNHZ" x="241.89" y="100.29" font-size="20" transform="matrix(1 0 0 1 72.42849650349658 445.10453088578436)"><tspan x="241.89" dy="0em" dominant-baseline="text-before-edge" :stroke="props.teeth[71]?.concern ? 'red' : undefined">71</tspan></text>
      <text id="db1fKZ8Bv2u" x="241.89" y="100.29" font-size="20" transform="matrix(1 0 0 1 110.36287150349685 430.50453088578445)"><tspan x="241.89" dy="0em" dominant-baseline="text-before-edge" :stroke="props.teeth[72]?.concern ? 'red' : undefined">72</tspan></text>
      <text id="ddgSWNXQt1" x="241.89" y="100.29" font-size="20" transform="matrix(1 0 0 1 135.69999271561827 396.11494755245076)"><tspan x="241.89" dy="0em" dominant-baseline="text-before-edge" :stroke="props.teeth[73]?.concern ? 'red' : undefined">73</tspan></text>
      <text id="db83Atca9Z" x="241.89" y="100.29" font-size="20" transform="matrix(1 0 0 1 147.12968021561827 350.3920846156701)"><tspan x="241.89" dy="0em" dominant-baseline="text-before-edge" :stroke="props.teeth[74]?.concern ? 'red' : undefined">74</tspan></text>
      <text id="dhfHo0NDB3" x="241.89" y="100.29" font-size="20" transform="matrix(1 0 0 1 154.3272936186599 258.43678158536613)"><tspan x="241.89" dy="0em" dominant-baseline="text-before-edge" :stroke="props.teeth[75]?.concern ? 'red' : undefined">75</tspan></text>
    </defs>

    <g class="main">
      <!-- Q5: upper-right 51-55 -->
      <g class="q5">
        <g @click="emit('tooth-click', 51)" style="cursor:pointer">
          <use href="#diso-51" :fill="conditionToColor(props.teeth[51]?.condition ?? 'sound')" />
          <use href="#diso-51" fill-opacity="0" stroke="#000" stroke-width="2" />
          <use href="#da3GVDWJbDP" fill-opacity="0" stroke="#000" stroke-width="2" />
        </g>
        <g @click="emit('tooth-click', 52)" style="cursor:pointer">
          <use href="#diso-52" :fill="conditionToColor(props.teeth[52]?.condition ?? 'sound')" />
          <use href="#diso-52" fill-opacity="0" stroke="#000" stroke-width="2" />
          <use href="#dc1vrzH7GD" fill-opacity="0" stroke="#000" stroke-width="2" />
        </g>
        <g @click="emit('tooth-click', 53)" style="cursor:pointer">
          <use href="#diso-53" :fill="conditionToColor(props.teeth[53]?.condition ?? 'sound')" />
          <use href="#diso-53" fill-opacity="0" stroke="#000" stroke-width="2" />
          <use href="#db2KyfohhGJ" fill-opacity="0" stroke="#000" stroke-width="2" />
        </g>
        <g @click="emit('tooth-click', 54)" style="cursor:pointer">
          <use href="#diso-54" :fill="conditionToColor(props.teeth[54]?.condition ?? 'sound')" />
          <use href="#diso-54" fill-opacity="0" stroke="#000" stroke-width="2" />
          <use href="#dcwHRvgNcf" fill="#000" />
        </g>
        <g @click="emit('tooth-click', 55)" style="cursor:pointer">
          <use href="#diso-55" :fill="conditionToColor(props.teeth[55]?.condition ?? 'sound')" />
          <use href="#diso-55" fill-opacity="0" stroke="#000" stroke-width="2" />
          <use href="#da882cHHUnK" fill="#000" />
        </g>
        <g class="text">
          <use href="#dc1Am1SRnuf" opacity="1" fill="#000" />
          <use href="#da1wTSzo241" opacity="1" fill="#000" />
          <use href="#ddngiuIzIj" opacity="1" fill="#000" />
          <use href="#daPscZuMW" opacity="1" fill="#000" />
          <use href="#devESRjLHU" opacity="1" fill="#000" />
        </g>
      </g>

      <!-- Q6: upper-left 61-65 -->
      <g class="g6">
        <g @click="emit('tooth-click', 61)" style="cursor:pointer">
          <use href="#diso-61" :fill="conditionToColor(props.teeth[61]?.condition ?? 'sound')" />
          <use href="#diso-61" fill-opacity="0" stroke="#000" stroke-width="2" />
          <use href="#dh1eFc4drSD" fill-opacity="0" stroke="#000" stroke-width="2" />
        </g>
        <g @click="emit('tooth-click', 62)" style="cursor:pointer">
          <use href="#diso-62" :fill="conditionToColor(props.teeth[62]?.condition ?? 'sound')" />
          <use href="#diso-62" fill-opacity="0" stroke="#000" stroke-width="2" />
          <use href="#df8TlGPwTJ" fill-opacity="0" stroke="#000" stroke-width="2" />
        </g>
        <g @click="emit('tooth-click', 63)" style="cursor:pointer">
          <use href="#diso-63" :fill="conditionToColor(props.teeth[63]?.condition ?? 'sound')" />
          <use href="#diso-63" fill-opacity="0" stroke="#000" stroke-width="2" />
          <use href="#da4D4emNiDi" fill-opacity="0" stroke="#000" stroke-width="2" />
        </g>
        <g @click="emit('tooth-click', 64)" style="cursor:pointer">
          <use href="#diso-64" :fill="conditionToColor(props.teeth[64]?.condition ?? 'sound')" />
          <use href="#diso-64" fill-opacity="0" stroke="#000" stroke-width="2" />
          <use href="#dg9i5HslOD" fill="#000" />
        </g>
        <g @click="emit('tooth-click', 65)" style="cursor:pointer">
          <use href="#diso-65" :fill="conditionToColor(props.teeth[65]?.condition ?? 'sound')" />
          <use href="#diso-65" fill-opacity="0" stroke="#000" stroke-width="2" />
          <use href="#dd9AQUN9l" fill="#000" />
        </g>
        <g class="text">
          <use href="#da3vLld1187" opacity="1" fill="#000" />
          <use href="#dd8C077TiQe" opacity="1" fill="#000" />
          <use href="#da3dsbSynl2" opacity="1" fill="#000" />
          <use href="#dc3i2cqy5i8" opacity="1" fill="#000" />
          <use href="#dc2Gq2EB8T" opacity="1" fill="#000" />
        </g>
      </g>

      <!-- Q7: lower-right 71-75 -->
      <g class="q7">
        <g @click="emit('tooth-click', 71)" style="cursor:pointer">
          <use href="#diso-71" :fill="conditionToColor(props.teeth[71]?.condition ?? 'sound')" />
          <use href="#diso-71" fill-opacity="0" stroke="#000" stroke-width="2" />
          <use href="#df1SexwZEcq" fill-opacity="0" stroke="#000" stroke-width="2" />
        </g>
        <g @click="emit('tooth-click', 72)" style="cursor:pointer">
          <use href="#diso-72" :fill="conditionToColor(props.teeth[72]?.condition ?? 'sound')" />
          <use href="#diso-72" fill-opacity="0" stroke="#000" stroke-width="2" />
          <use href="#db9tcVaTZ" fill-opacity="0" stroke="#000" stroke-width="2" />
        </g>
        <g @click="emit('tooth-click', 73)" style="cursor:pointer">
          <use href="#diso-73" :fill="conditionToColor(props.teeth[73]?.condition ?? 'sound')" />
          <use href="#diso-73" fill-opacity="0" stroke="#000" stroke-width="2" />
          <use href="#dhdg0tmh2L" fill-opacity="0" stroke="#000" stroke-width="2" />
        </g>
        <g @click="emit('tooth-click', 74)" style="cursor:pointer">
          <use href="#diso-74" :fill="conditionToColor(props.teeth[74]?.condition ?? 'sound')" />
          <use href="#diso-74" fill-opacity="0" stroke="#000" stroke-width="2" />
          <use href="#da4VwzCcbws" fill="#000" />
        </g>
        <g @click="emit('tooth-click', 75)" style="cursor:pointer">
          <use href="#diso-75" :fill="conditionToColor(props.teeth[75]?.condition ?? 'sound')" />
          <use href="#diso-75" fill-opacity="0" stroke="#000" stroke-width="2" />
          <use href="#dh46WoT2rhW" fill="#000" />
        </g>
        <g class="text">
          <use href="#da253G7JNHZ" opacity="1" fill="#000" />
          <use href="#db1fKZ8Bv2u" opacity="1" fill="#000" />
          <use href="#ddgSWNXQt1" opacity="1" fill="#000" />
          <use href="#db83Atca9Z" opacity="1" fill="#000" />
          <use href="#dhfHo0NDB3" opacity="1" fill="#000" />
        </g>
      </g>

      <!-- Q8: lower-left 81-85 -->
      <g class="q8">
        <g @click="emit('tooth-click', 81)" style="cursor:pointer">
          <use href="#diso-81" :fill="conditionToColor(props.teeth[81]?.condition ?? 'sound')" />
          <use href="#diso-81" fill-opacity="0" stroke="#000" stroke-width="2" />
          <use href="#dbaO5m8gAJ" fill-opacity="0" stroke="#000" stroke-width="2" />
        </g>
        <g @click="emit('tooth-click', 82)" style="cursor:pointer">
          <use href="#diso-82" :fill="conditionToColor(props.teeth[82]?.condition ?? 'sound')" />
          <use href="#diso-82" fill-opacity="0" stroke="#000" stroke-width="2" />
          <use href="#db1OuMQtEP6" fill-opacity="0" stroke="#000" stroke-width="2" />
        </g>
        <g @click="emit('tooth-click', 83)" style="cursor:pointer">
          <use href="#diso-83" :fill="conditionToColor(props.teeth[83]?.condition ?? 'sound')" />
          <use href="#diso-83" fill-opacity="0" stroke="#000" stroke-width="2" />
          <use href="#db2roP7vEXi" fill-opacity="0" stroke="#000" stroke-width="2" />
        </g>
        <g @click="emit('tooth-click', 84)" style="cursor:pointer">
          <use href="#diso-84" :fill="conditionToColor(props.teeth[84]?.condition ?? 'sound')" />
          <use href="#diso-84" fill-opacity="0" stroke="#000" stroke-width="2" />
          <use href="#da5EcJWHaOD" fill="#000" />
        </g>
        <g @click="emit('tooth-click', 85)" style="cursor:pointer">
          <use href="#diso-85" :fill="conditionToColor(props.teeth[85]?.condition ?? 'sound')" />
          <use href="#diso-85" fill-opacity="0" stroke="#000" stroke-width="2" />
          <use href="#davxQ9BjFX" fill="#000" />
        </g>
        <g class="text">
          <use href="#da1jKNA7rAN" opacity="1" fill="#000" />
          <use href="#daAHeijBe5" opacity="1" fill="#000" />
          <use href="#dek5cw6Hgp" opacity="1" fill="#000" />
          <use href="#dg2rNJx6rxS" opacity="1" fill="#000" />
          <use href="#dd14UMdDj6N" opacity="1" fill="#000" />
        </g>
      </g>
    </g>
  </svg>

  <svg v-else
    width="100%"
    style="max-height:600px;display:block;margin:0 auto"
    version="1.1"
    preserveAspectRatio="xMidYMid meet"
    viewBox="0 0 560 1055"
  >
    <defs>
      <path
        style="cursor:pointer"
        d="M266.17 8.55C259.99 -4.36 193.1 6.32 197.86 21.38C206.17 47.66 225.74 73.28 248.05 67.4C267.9 62.17 262.54 20.32 266.17 8.55Z"
        id="iso-11"
      />
      <path
        style="cursor:pointer"
        d="M250.64 19.39C239.08 14.5 227 16.21 214.06 26.43"
        id="iso-11a"
      />
      <path
        style="cursor:pointer"
        d="M145.49 62.43C137.94 40.31 191.03 12.91 200.03 32.34C205.95 45.15 204.62 79.12 191.95 86.18C177.61 94.17 150.76 77.86 145.49 62.43Z"
        id="iso-12"
      />
      <path
        style="cursor:pointer"
        d="M186.48 40.87C177.65 41.5 170.4 40.72 159.99 53.98"
        id="iso-12a"
      />
      <path
        style="cursor:pointer"
        d="M150.11 75.16C142.5 69.28 129.83 70.79 121.26 75.16C111.64 80.07 105.24 91.01 102.25 101.39C99.52 110.86 104.3 132.99 114.05 131.55C134.71 128.49 156.11 139.07 161.91 120.4C167.02 103.98 162.44 84.69 150.11 75.16Z"
        id="iso-13"
      />
      <path
        style="cursor:pointer"
        d="M137.24 82.38C117.15 85.94 113.51 101.9 112.46 113.44"
        id="iso-13a"
      />
      <path
        style="cursor:pointer"
        d="M18.36 529.31C18.36 529.31 7.02 525.35 5.37 504.43C4.86 497.88 13.89 490.15 12.81 482.51C10.67 467.32 21.2 448.9 31.68 446.13C58.89 438.94 72.33 459.38 79.53 476.93C86.12 492.99 79.12 515.06 68.15 527.74C56.25 534.5 32.29 530.07 18.36 529.31Z"
        id="iso-18"
      />
      <path
        style="cursor:pointer"
        d="M98.89 414.82C91.72 434.68 71.23 446.39 48.57 441.68C28.93 437.59 16.41 426.82 11.8 400.23C7.47 375.3 4.28 345.65 48.9 345.64C91.28 345.62 114.44 371.79 98.89 414.82Z"
        id="iso-17"
      />
      <path
        style="cursor:pointer"
        d="M78.88 362.56C72.53 364.71 61.58 363.31 60.14 370.37C59.95 371.31 58.41 378.85 58.22 379.79C62.2 382.7 69.4 379.52 75.18 379.02C75.16 379.44 55.97 386.13 55.81 386.2C53.89 387.07 49.14 400.59 53.55 406.92C61.81 412.09 70.99 407.73 79.55 407.88C71.38 409.57 59.68 411.06 58.93 413.2C57.6 420.28 56.36 425.9 55.13 431.44C55.14 425.13 56.46 418.45 52.15 413.39C41.3 410.68 40.92 412.54 35.26 412.97C40.74 411.11 44.03 406.54 46.15 400.52C48.16 392.44 46.33 392.05 45.45 389.75C39.48 387.56 36.28 390.97 31.82 391.32C37.61 388.74 44.41 385.5 49.31 381.64C55.02 377.15 47.89 371.47 42.78 366.36C49.45 364.88 56.47 365.06 61.1 354.34C62.36 362.44 71.16 361.06 78.88 362.56Z"
        id="iso-17a"
      />
      <path
        style="cursor:pointer"
        d="M44.65 266.85C44.65 266.85 32.12 267.49 26.4 284.67C24.61 290.05 32.51 298.7 29.93 304.86C24.79 317.11 28.02 335.09 38.38 339.9C45.63 343.28 58.05 342.06 64.03 342.11C80.21 342.25 90.22 334.9 98.14 325.38C108.05 313.45 105.01 293.25 96.05 279.99C84.99 271.49 59.26 269.52 44.65 266.85Z"
        id="iso-16"
      />
      <path
        style="cursor:pointer"
        d="M56.94 494.91C60.48 492.65 67.62 496.05 72.83 497.1C71.34 496.21 59.47 489.15 57.98 488.26C52.76 480.91 55.48 474.74 55.2 467.8C51.42 468.58 48.21 465.25 45.07 461.37C45.68 465.45 50.5 471.58 45.68 473.01C44.93 472.73 41.17 471.36 34.4 468.9C41.23 473.96 45.02 476.77 45.78 477.33C45.78 477.33 48.56 483.47 46 482.51C43.43 481.56 31.11 484.1 31.11 484.1C31.11 484.1 43.66 483.26 48.24 488.28C52.82 493.3 52.75 496.35 53.21 499.76C53.68 503.17 52.89 506.57 54.97 509.07C56.8 511.28 63.26 512.72 63.26 512.72C59.78 506.61 57.11 500.6 56.94 494.91Z"
        id="b2DYah0Bi"
      />
      <path
        style="cursor:pointer"
        d="M124.86 144.48C120.94 136.65 109.98 133 101.25 133.32C91.45 133.67 81.91 140.28 75.4 147.74C69.45 154.55 63.37 185.34 71.92 187.91C90.03 193.36 104.78 206.01 116.86 192.75C127.48 181.1 131.22 157.16 124.86 144.48Z"
        id="iso-14"
      />
      <path
        style="cursor:pointer"
        d="M104.66 146.08C96.02 147.61 88.62 150.83 84.96 155.61C80.11 161.94 80.47 170.56 79.88 177.14"
        id="b6fpiYGql"
      />
      <path
        style="cursor:pointer"
        d="M69.15 299.11C72.26 301.81 79.33 298.09 84.34 297.03C82.86 298.01 70.96 305.83 69.47 306.81C63.82 315.15 65.77 322.32 64.82 330.31C61.33 329.32 57.97 333.06 54.63 337.45C55.61 332.77 60.76 325.83 56.36 324.06C55.62 324.35 51.94 325.83 45.32 328.49C52.25 322.84 56.11 319.7 56.88 319.07C56.88 319.07 60.11 312.08 57.6 313.11C55.08 314.14 43.72 310.87 43.72 310.87C43.72 310.87 55.47 312.18 60.29 306.52C65.1 300.86 65.34 297.34 66.11 293.42C66.89 289.51 66.48 285.57 68.69 282.74C70.63 280.25 76.87 278.76 76.87 278.76C72.98 285.71 69.87 292.56 69.15 299.11Z"
        id="b6rcDQpXhc"
      />
      <path
        style="cursor:pointer"
        d="M91.09 200.85C85.15 193.29 72.49 191.66 63.11 193.81C52.59 196.23 43.71 205.28 38.28 214.61C33.32 223.13 37.92 262.17 47.73 263.15C68.51 265.22 86.64 275.94 96.82 259.25C105.78 244.58 100.73 213.1 91.09 200.85Z"
        id="iso-15"
      />
      <path
        style="cursor:pointer"
        d="M47.29 239.85C48.2 237.5 47.09 235.21 47.29 233.03C47.82 226.98 48.23 221.74 51.73 217.98C53.09 216.51 54.68 215.22 56.42 214.05C61.11 210.89 66.87 208.65 72.13 206.52"
        id="b22znv61x"
      />
      <path
        style="cursor:pointer"
        d="M89.08 186.79C96.72 187.31 104.32 187.57 108.8 184.62C116.26 179.71 118.22 169.44 120.59 162.59"
        id="cyecxkyP8"
      />
      <path
        style="cursor:pointer"
        d="M65.93 256.06C86.29 257.43 88.65 244.61 92.44 233.66"
        id="a3AsQKojJ1"
      />
      <text
        id="b16evo6f5C"
        x="214.21"
        y="10.52"
        font-size="45"
        transform="matrix(1 0 0 1 10.526439084936285 162.96435359690972)"
      >
        <tspan x="214.21" dy="0em" dominant-baseline="text-before-edge" />
      </text>
      <text
        id="a4WSJkkK4"
        x="214.21"
        y="10.52"
        font-size="45"
        transform="matrix(1 0 0 1 27.682689084936285 178.58935359690972)"
      >
        <tspan x="214.21" dy="0em" dominant-baseline="text-before-edge" />
      </text>
      <text
        id="dhJLWP0Rx"
        x="241.89"
        y="100.29"
        font-size="20"
        transform="matrix(1 0 0 1 -8.000000000000028 -30.303030303030482)"
      >
        <tspan
          x="241.89"
          dy="0em"
          dominant-baseline="text-before-edge"
          :stroke="teeth[11]?.concern ? 'red' : undefined"
        >11</tspan>
      </text>
      <text
        id="h484gZh3x"
        x="241.89"
        y="100.29"
        font-size="20"
        transform="matrix(1 0 0 1 -45.04545454545476 -19.8333333333336)"
      >
        <tspan
          x="241.89"
          dy="0em"
          dominant-baseline="text-before-edge"
          :stroke="teeth[12]?.concern ? 'red' : undefined"
        >12</tspan>
      </text>
      <text
        id="a5HTD7Ziun"
        x="241.89"
        y="100.29"
        font-size="20"
        transform="matrix(1 0 0 1 -76.03030303030349 16.257575757575637)"
      >
        <tspan
          x="241.89"
          dy="0em"
          dominant-baseline="text-before-edge"
          :stroke="teeth[13]?.concern ? 'red' : undefined"
        >13</tspan>
      </text>
      <text
        id="dPldy7HEx"
        x="241.89"
        y="100.29"
        font-size="20"
        transform="matrix(1 0 0 1 -110.04545454545521 61.819418583930684)"
      >
        <tspan
          x="241.89"
          dy="0em"
          dominant-baseline="text-before-edge"
          :stroke="teeth[14]?.concern ? 'red' : undefined"
        >14</tspan>
      </text>
      <text
        id="aagZSuMJr"
        x="241.89"
        y="100.29"
        font-size="20"
        transform="matrix(1 0 0 1 -132.90482954545524 122.24318752332468)"
      >
        <tspan
          x="241.89"
          dy="0em"
          dominant-baseline="text-before-edge"
          :stroke="teeth[15]?.concern ? 'red' : undefined"
        >15</tspan>
      </text>
      <text
        id="c3f2gAlj3"
        x="241.89"
        y="100.29"
        font-size="20"
        transform="matrix(1 0 0 1 -132.90482954545524 187.2124110081733)"
      >
        <tspan
          x="241.89"
          dy="0em"
          dominant-baseline="text-before-edge"
          :stroke="teeth[16]?.concern ? 'red' : undefined"
        >16</tspan>
      </text>
      <text
        id="fWwh13pJ"
        x="241.89"
        y="100.29"
        font-size="20"
        transform="matrix(1 0 0 1 -134.90482954545524 279.45436176574924)"
      >
        <tspan
          x="241.89"
          dy="0em"
          dominant-baseline="text-before-edge"
          :stroke="teeth[17]?.concern ? 'red' : undefined"
        >17</tspan>
      </text>
      <text
        id="iALQXea9Y"
        x="241.89"
        y="100.29"
        font-size="20"
        transform="matrix(1 0 0 1 -155.76420454545527 379.27207009908284)"
      >
        <tspan
          x="241.89"
          dy="0em"
          dominant-baseline="text-before-edge"
          :stroke="teeth[18]?.concern ? 'red' : undefined"
        >18</tspan>
      </text>
      <path
        style="cursor:pointer"
        d="M293.44 8.55C299.61 -4.36 366.51 6.32 361.74 21.38C353.43 47.66 333.86 73.28 311.56 67.4C291.71 62.17 297.06 20.32 293.44 8.55Z"
        id="iso-21"
      />
      <path
        style="cursor:pointer"
        d="M308.96 19.39C320.52 14.5 332.61 16.21 345.55 26.43"
        id="h3ymJ8JsAJ"
      />
      <path
        style="cursor:pointer"
        d="M414.11 62.43C421.67 40.31 368.58 12.91 359.58 32.34C353.65 45.15 354.99 79.12 367.65 86.18C382 94.17 408.85 77.86 414.11 62.43Z"
        id="iso-22"
      />
      <path
        style="cursor:pointer"
        d="M373.13 40.87C381.95 41.5 389.21 40.72 399.62 53.98"
        id="e7zZFZz9XZ"
      />
      <path
        style="cursor:pointer"
        d="M409.49 75.16C417.1 69.28 429.78 70.79 438.34 75.16C447.96 80.07 454.37 91.01 457.36 101.39C460.09 110.86 455.31 132.99 445.56 131.55C424.89 128.49 403.5 139.07 397.69 120.4C392.59 103.98 397.16 84.69 409.49 75.16Z"
        id="iso-23"
      />
      <path
        style="cursor:pointer"
        d="M422.37 82.38C442.46 85.94 446.1 101.9 447.15 113.44"
        id="bX8HWOfji"
      />
      <path
        style="cursor:pointer"
        d="M541.25 529.31C541.25 529.31 552.59 525.35 554.23 504.43C554.75 497.88 545.72 490.15 546.8 482.51C548.94 467.32 538.41 448.9 527.93 446.13C500.72 438.94 487.28 459.38 480.08 476.93C473.49 492.99 480.49 515.06 491.46 527.74C503.35 534.5 527.32 530.07 541.25 529.31Z"
        id="iso-28"
      />
      <path
        style="cursor:pointer"
        d="M460.71 414.82C467.89 434.68 488.38 446.39 511.04 441.68C530.67 437.59 543.19 426.82 547.81 400.23C552.14 375.3 555.32 345.65 510.71 345.64C468.33 345.62 445.17 371.79 460.71 414.82Z"
        id="iso-27"
      />
      <path
        style="cursor:pointer"
        d="M480.73 362.56C487.08 364.71 498.03 363.31 499.47 370.37C499.66 371.31 501.19 378.85 501.38 379.79C497.4 382.7 490.21 379.52 484.42 379.02C484.45 379.44 503.64 386.13 503.8 386.2C505.71 387.07 510.47 400.59 506.05 406.92C497.79 412.09 488.62 407.73 480.06 407.88C488.23 409.57 499.93 411.06 500.68 413.2C502 420.28 503.24 425.9 504.47 431.44C504.47 425.13 503.15 418.45 507.45 413.39C518.31 410.68 518.69 412.54 524.35 412.97C518.87 411.11 515.58 406.54 513.45 400.52C511.45 392.44 513.28 392.05 514.16 389.75C520.13 387.56 523.32 390.97 527.79 391.32C522 388.74 515.2 385.5 510.29 381.64C504.59 377.15 511.72 371.47 516.82 366.36C510.16 364.88 503.13 365.06 498.51 354.34C497.25 362.44 488.45 361.06 480.73 362.56Z"
        id="lmVcyt8R"
      />
      <text
        id="anXNzSK2j"
        x="214.21"
        y="10.52"
        font-size="45"
        transform="matrix(-1 0 0 1 519.8434429734264 -14.916991393939833)"
      >
        <tspan x="214.21" dy="0em" dominant-baseline="text-before-edge" />
      </text>
      <path
        style="cursor:pointer"
        d="M514.96 266.85C514.96 266.85 527.49 267.49 533.2 284.67C534.99 290.05 527.1 298.7 529.68 304.86C534.82 317.11 531.59 335.09 521.23 339.9C513.97 343.28 501.56 342.06 495.58 342.11C479.4 342.25 469.38 334.9 461.47 325.38C451.56 313.45 454.6 293.25 463.55 279.99C474.61 271.49 500.35 269.52 514.96 266.85Z"
        id="iso-26"
      />
      <path
        style="cursor:pointer"
        d="M502.67 494.91C499.12 492.65 491.98 496.05 486.78 497.1C488.26 496.21 500.14 489.15 501.62 488.26C506.85 480.91 504.13 474.74 504.4 467.8C508.19 468.58 511.4 465.25 514.53 461.37C513.93 465.45 509.1 471.58 513.93 473.01C514.68 472.73 518.44 471.36 525.21 468.9C518.38 473.96 514.59 476.77 513.83 477.33C513.83 477.33 511.04 483.47 513.61 482.51C516.18 481.56 528.5 484.1 528.5 484.1C528.5 484.1 515.94 483.26 511.36 488.28C506.78 493.3 506.86 496.35 506.39 499.76C505.93 503.17 506.72 506.57 504.64 509.07C502.81 511.28 496.35 512.72 496.35 512.72C499.82 506.61 502.5 500.6 502.67 494.91Z"
        id="bsHecJRYc"
      />
      <path
        style="cursor:pointer"
        d="M434.74 144.48C438.66 136.65 449.63 133 458.35 133.32C468.15 133.67 477.69 140.28 484.21 147.74C490.16 154.55 496.24 185.34 487.69 187.91C469.58 193.36 454.82 206.01 442.74 192.75C432.12 181.1 428.39 157.16 434.74 144.48Z"
        id="iso-24"
      />
      <path
        style="cursor:pointer"
        d="M454.95 146.08C463.59 147.61 470.99 150.83 474.64 155.61C479.49 161.94 479.13 170.56 479.73 177.14"
        id="d6p4ZsEBwV"
      />
      <path
        style="cursor:pointer"
        d="M490.46 299.11C487.34 301.81 480.27 298.09 475.26 297.03C476.75 298.01 488.65 305.83 490.13 306.81C495.79 315.15 493.84 322.32 494.78 330.31C498.27 329.32 501.63 333.06 504.97 337.45C504 332.77 498.84 325.83 503.25 324.06C503.98 324.35 507.67 325.83 514.29 328.49C507.35 322.84 503.5 319.7 502.72 319.07C502.72 319.07 499.49 312.08 502.01 313.11C504.52 314.14 515.89 310.87 515.89 310.87C515.89 310.87 504.13 312.18 499.32 306.52C494.5 300.86 494.27 297.34 493.49 293.42C492.72 289.51 493.12 285.57 490.92 282.74C488.97 280.25 482.74 278.76 482.74 278.76C486.62 285.71 489.74 292.56 490.46 299.11Z"
        id="aLBv0ngyf"
      />
      <path
        style="cursor:pointer"
        d="M468.51 200.85C474.46 193.29 487.12 191.66 496.49 193.81C507.02 196.23 515.9 205.28 521.33 214.61C526.28 223.13 521.68 262.17 511.88 263.15C491.09 265.22 472.97 275.94 462.78 259.25C453.83 244.58 458.88 213.1 468.51 200.85Z"
        id="iso-25"
      />
      <path
        style="cursor:pointer"
        d="M512.32 239.85C511.4 237.5 512.51 235.21 512.32 233.03C511.78 226.98 511.38 221.74 507.88 217.98C506.51 216.51 504.92 215.22 503.19 214.05C498.49 210.89 492.74 208.65 487.48 206.52"
        id="a1IjZsIm8S"
      />
      <path
        style="cursor:pointer"
        d="M470.52 186.79C462.89 187.31 455.28 187.57 450.81 184.62C443.35 179.71 441.38 169.44 439.01 162.59"
        id="b2b6VhQYX9"
      />
      <path
        style="cursor:pointer"
        d="M493.67 256.06C473.32 257.43 470.95 244.61 467.16 233.66"
        id="b2JgD7E2Kq"
      />
      <text
        id="b1gODCfJB5"
        x="241.89"
        y="100.29"
        font-size="20"
        transform="matrix(1 0 0 1 62.5303030303032 -33.3333333333336)"
      >
        <tspan
          x="241.89"
          dy="0em"
          dominant-baseline="text-before-edge"
          :stroke="teeth[21]?.concern ? 'red' : undefined"
        >21</tspan>
      </text>
      <text
        id="a2KwBh9N1C"
        x="241.89"
        y="100.29"
        font-size="20"
        transform="matrix(1 0 0 1 98.21212121212167 -19.8333333333336)"
      >
        <tspan
          x="241.89"
          dy="0em"
          dominant-baseline="text-before-edge"
          :stroke="teeth[22]?.concern ? 'red' : undefined"
        >22</tspan>
      </text>
      <text
        id="avSr25PQ8"
        x="241.89"
        y="100.29"
        font-size="20"
        transform="matrix(1 0 0 1 130.03030303030368 16.257575757575637)"
      >
        <tspan
          x="241.89"
          dy="0em"
          dominant-baseline="text-before-edge"
          :stroke="teeth[23]?.concern ? 'red' : undefined"
        >23</tspan>
      </text>
      <text
        id="b1IAgvlN7L"
        x="241.89"
        y="100.29"
        font-size="20"
        transform="matrix(1 0 0 1 162.49083356665588 61.819418583930684)"
      >
        <tspan
          x="241.89"
          dy="0em"
          dominant-baseline="text-before-edge"
          :stroke="teeth[24]?.concern ? 'red' : undefined"
        >24</tspan>
      </text>
      <text
        id="a5jdHsmSg"
        x="241.89"
        y="100.29"
        font-size="20"
        transform="matrix(1 0 0 1 189.14062500000085 122.24318752332468)"
      >
        <tspan
          x="241.89"
          dy="0em"
          dominant-baseline="text-before-edge"
          :stroke="teeth[25]?.concern ? 'red' : undefined"
        >25</tspan>
      </text>
      <text
        id="eEJTk9OPg"
        x="241.89"
        y="100.29"
        font-size="20"
        transform="matrix(1 0 0 1 185.3502085666559 187.2124110081733)"
      >
        <tspan
          x="241.89"
          dy="0em"
          dominant-baseline="text-before-edge"
          :stroke="teeth[26]?.concern ? 'red' : undefined"
        >26</tspan>
      </text>
      <text
        id="a1kI1wu28"
        x="241.89"
        y="100.29"
        font-size="20"
        transform="matrix(1 0 0 1 185.35020856665585 279.45436176574924)"
      >
        <tspan
          x="241.89"
          dy="0em"
          dominant-baseline="text-before-edge"
          :stroke="teeth[27]?.concern ? 'red' : undefined"
        >27</tspan>
      </text>
      <text
        id="f10grZcqP0"
        x="241.89"
        y="100.29"
        font-size="20"
        transform="matrix(1 0 0 1 208.20958356665594 379.27207009908284)"
      >
        <tspan
          x="241.89"
          dy="0em"
          dominant-baseline="text-before-edge"
          :stroke="teeth[28]?.concern ? 'red' : undefined"
        >28</tspan>
      </text>
      <path
        style="cursor:pointer"
        d="M264.9 1047.24C261.44 1058.52 216.61 1052.18 219.04 1039.13C223.27 1016.34 235 993.66 250.05 997.75C263.46 1001.39 261.93 1037.34 264.9 1047.24Z"
        id="iso-41"
      />
      <path
        style="cursor:pointer"
        d="M254.1 1038.64C246.68 1043.28 238.59 1042.33 229.52 1034.14"
        id="a2Ot1hj5Ti"
      />
      <path
        style="cursor:pointer"
        d="M161.38 1007.25C155.47 1029.79 207.41 1053.97 214.85 1034.04C219.75 1020.91 216.56 987.08 204.13 980.78C190.07 973.66 165.51 991.54 161.38 1007.25Z"
        id="iso-42"
      />
      <path
        style="cursor:pointer"
        d="M201.5 1026.33C193.09 1026.23 186.25 1027.45 175.62 1014.83"
        id="c3OkjuGmoe"
      />
      <path
        style="cursor:pointer"
        d="M167.04 994.77C160.15 1001.09 148.04 1000.34 139.66 996.49C130.25 992.16 123.55 981.62 120.13 971.44C117 962.15 120.28 939.77 129.62 940.63C149.4 942.46 169.12 930.62 175.68 948.91C181.46 964.99 178.21 984.52 167.04 994.77Z"
        id="iso-43"
      />
      <path
        style="cursor:pointer"
        d="M154.41 988.33C135.14 985.97 130.78 970.26 129.13 958.8"
        id="c1DvhakQel"
      />
      <path
        style="cursor:pointer"
        d="M16.27 549.27C16.27 549.27 5.73 553.9 5.35 574.88C5.23 581.45 14.25 588.63 13.65 596.32C12.48 611.61 23.52 629.37 33.62 631.51C59.86 637.07 71.46 615.86 77.3 597.91C82.64 581.49 74.74 559.88 63.62 547.87C51.94 541.83 29.45 547.69 16.27 549.27Z"
        id="iso-48"
      />
      <path
        style="cursor:pointer"
        d="M99.19 658.77C91.26 639.36 71.15 628.89 49.9 634.95C31.5 640.2 20.23 651.7 17.35 678.51C14.66 703.65 13.31 733.44 55.66 730.8C95.88 728.29 116.38 700.79 99.19 658.77Z"
        id="iso-47"
      />
      <path
        style="cursor:pointer"
        d="M83.15 712.12C77.01 710.36 66.69 712.41 64.93 705.44C64.69 704.51 62.81 697.08 62.57 696.15C66.19 693.01 73.2 695.75 78.72 695.91C78.67 695.49 60.07 689.96 59.92 689.9C58.05 689.15 52.78 675.93 56.61 669.35C64.15 663.69 73.11 667.5 81.22 666.85C73.37 665.64 62.18 664.85 61.35 662.76C59.69 655.77 58.2 650.23 56.71 644.78C57.08 651.07 58.71 657.66 54.91 662.98C44.76 666.32 44.29 664.49 38.9 664.4C44.2 665.92 47.58 670.3 49.95 676.18C52.3 684.13 50.59 684.63 49.88 686.97C44.34 689.51 41.12 686.3 36.86 686.22C42.5 688.44 49.14 691.27 54.01 694.84C59.68 698.98 53.24 705.07 48.68 710.48C55.09 711.56 61.75 710.96 66.74 721.38C67.48 713.23 75.91 714.07 83.15 712.12Z"
        id="c18sfWQXw1"
      />
      <text
        id="b2iKkN8Sl1"
        x="214.21"
        y="10.52"
        font-size="44"
        transform="matrix(0.9980376052223248 -0.0626173982379266 -0.05663394169426829 -0.9983950103281617 56.93330868565021 1091.9163454821464)"
      >
        <tspan x="214.21" dy="0em" dominant-baseline="text-before-edge" />
      </text>
      <path
        style="cursor:pointer"
        d="M56.08 809.7C56.08 809.7 44.16 809.8 37.76 792.99C35.75 787.73 42.76 778.63 39.96 772.64C34.39 760.71 36.44 742.58 45.99 737.15C52.69 733.35 64.54 733.83 70.22 733.42C85.56 732.31 95.49 739.06 103.54 748.09C113.62 759.4 111.88 779.75 104.13 793.52C94.12 802.67 69.8 806.16 56.08 809.7Z"
        id="iso-46"
      />
      <path
        style="cursor:pointer"
        d="M54.84 581.31C58.33 583.35 64.91 579.54 69.79 578.18C68.44 579.16 57.56 586.92 56.21 587.89C51.66 595.54 54.59 601.53 54.72 608.47C51.09 607.93 48.23 611.44 45.47 615.5C45.82 611.4 50.05 604.99 45.39 603.85C44.69 604.17 41.2 605.76 34.92 608.62C41.11 603.16 44.55 600.13 45.24 599.52C45.24 599.52 47.53 593.24 45.15 594.34C42.77 595.44 30.93 593.64 30.93 593.64C30.93 593.64 42.89 593.73 46.96 588.44C51.02 583.16 50.78 580.12 51.03 576.69C51.27 573.26 50.33 569.91 52.16 567.29C53.78 564.98 59.83 563.16 59.83 563.16C56.87 569.47 54.67 575.62 54.84 581.31Z"
        id="b7ARVWKg9"
      />
      <path
        style="cursor:pointer"
        d="M35.25 624.78C31.16 619.74 27.5 608.86 24.26 592.15L18.31 578.44C19.48 568.55 20.23 562.9 20.55 561.49"
        id="kjsO4lDF"
      />
      <path
        style="cursor:pointer"
        d="M139.15 927.08C135.87 935.12 125.67 939.42 117.37 939.62C108.05 939.85 98.62 933.83 92.01 926.77C85.98 920.33 78.47 889.95 86.44 886.88C103.32 880.35 116.61 866.85 128.82 879.36C139.56 890.37 144.46 914.04 139.15 927.08Z"
        id="iso-44"
      />
      <path
        style="cursor:pointer"
        d="M119.88 926.69C111.59 925.67 104.39 922.9 100.65 918.34C95.69 912.31 95.54 903.69 94.6 897.16"
        id="c2SUh81nX8"
      />
      <path
        style="cursor:pointer"
        d="M77.51 776.04C80.31 773.15 87.24 776.45 92.05 777.21C90.59 776.32 78.85 769.22 77.38 768.33C71.54 760.35 72.99 753.07 71.64 745.15C68.38 746.35 64.98 742.81 61.56 738.63C62.75 743.24 68.04 749.86 63.96 751.9C63.24 751.65 59.67 750.39 53.23 748.13C60.13 753.36 63.97 756.26 64.74 756.84C64.74 756.84 68.2 763.63 65.76 762.75C63.31 761.87 52.71 765.81 52.71 765.81C52.71 765.81 63.79 763.81 68.68 769.17C73.58 774.54 74 778.03 74.95 781.89C75.91 785.76 75.75 789.71 78 792.41C79.99 794.78 85.99 795.89 85.99 795.89C81.91 789.18 78.56 782.53 77.51 776.04Z"
        id="b3NaX9ixLx"
      />
      <path
        style="cursor:pointer"
        d="M103.9 872.82C98.69 880.72 86.77 883.09 77.75 881.51C67.62 879.73 58.68 871.22 53 862.23C47.81 854.02 49.96 814.77 59.22 813.21C78.83 809.91 95.43 798.13 106.04 814.18C115.37 828.29 112.36 860.02 103.9 872.82Z"
        id="iso-45"
      />
      <path
        style="cursor:pointer"
        d="M60.12 836.49C61.12 838.79 60.2 841.14 60.5 843.3C61.36 849.31 62.04 854.52 65.57 858.06C66.95 859.44 68.53 860.64 70.25 861.71C74.88 864.58 80.47 866.47 85.58 868.29"
        id="c9QkCsAMn"
      />
      <path
        style="cursor:pointer"
        d="M102.79 886.97C110.01 886 117.22 885.28 121.63 887.96C128.99 892.42 131.44 902.56 134.07 909.25"
        id="d38q1jr7XL"
      />
      <path
        style="cursor:pointer"
        d="M76.9 819.2C96.14 816.63 99.11 829.28 103.33 839.99"
        id="amh0k6iSv"
      />
      <text
        id="b85Z9biXKR"
        x="241.89"
        y="100.29"
        font-size="20"
        transform="matrix(1 0 0 1 -5.500000000000028 869.8745265151553)"
      >
        <tspan
          x="241.89"
          dy="0em"
          dominant-baseline="text-before-edge"
          :stroke="teeth[41]?.concern ? 'red' : undefined"
        >41</tspan>
      </text>
      <text
        id="c1DY6ILtkz"
        x="241.89"
        y="100.29"
        font-size="20"
        transform="matrix(1 0 0 1 -39.76562500000003 855.2745265151555)"
      >
        <tspan
          x="241.89"
          dy="0em"
          dominant-baseline="text-before-edge"
          :stroke="teeth[42]?.concern ? 'red' : undefined"
        >42</tspan>
      </text>
      <text
        id="b7Um5lGNA6"
        x="241.89"
        y="100.29"
        font-size="20"
        transform="matrix(1 0 0 1 -67.65482954545479 820.8849431818218)"
      >
        <tspan
          x="241.89"
          dy="0em"
          dominant-baseline="text-before-edge"
          :stroke="teeth[43]?.concern ? 'red' : undefined"
        >43</tspan>
      </text>
      <text
        id="bFYSV3ojY"
        x="241.89"
        y="100.29"
        font-size="20"
        transform="matrix(1 0 0 1 -101.11576704545519 770.7026515151548)"
      >
        <tspan
          x="241.89"
          dy="0em"
          dominant-baseline="text-before-edge"
          :stroke="teeth[44]?.concern ? 'red' : undefined"
        >44</tspan>
      </text>
      <text
        id="a58joFtV32"
        x="241.89"
        y="100.29"
        font-size="20"
        transform="matrix(1 0 0 1 -125.48784120066395 713.8795190562305)"
      >
        <tspan
          x="241.89"
          dy="0em"
          dominant-baseline="text-before-edge"
          :stroke="teeth[45]?.concern ? 'red' : undefined"
        >45</tspan>
      </text>
      <text
        id="d1FL8DxoUa"
        x="241.89"
        y="100.29"
        font-size="20"
        transform="matrix(1 0 0 1 -127.01010687857391 647.545712238048)"
      >
        <tspan
          x="241.89"
          dy="0em"
          dominant-baseline="text-before-edge"
          :stroke="teeth[46]?.concern ? 'red' : undefined"
        >46</tspan>
      </text>
      <text
        id="c1WvdIbIzw"
        x="241.89"
        y="100.29"
        font-size="20"
        transform="matrix(1 0 0 1 -132.90482954545524 552.0747842077441)"
      >
        <tspan
          x="241.89"
          dy="0em"
          dominant-baseline="text-before-edge"
          :stroke="teeth[47]?.concern ? 'red' : undefined"
        >47</tspan>
      </text>
      <text
        id="g1ie3fhzhA"
        x="241.89"
        y="100.29"
        font-size="20"
        transform="matrix(1 0 0 1 -159.776903700664 465.24931072289553)"
      >
        <tspan
          x="241.89"
          dy="0em"
          dominant-baseline="text-before-edge"
          :stroke="teeth[48]?.concern ? 'red' : undefined"
        >48</tspan>
      </text>
      <path
        style="cursor:pointer"
        d="M294.7 1047.24C298.16 1058.52 342.99 1052.18 340.57 1039.13C336.33 1016.34 324.61 993.66 309.55 997.75C296.15 1001.39 297.67 1037.34 294.7 1047.24Z"
        id="iso-31"
      />
      <path
        style="cursor:pointer"
        d="M305.51 1038.64C312.93 1043.28 321.02 1042.33 330.08 1034.14"
        id="cjuFfUWr"
      />
      <path
        style="cursor:pointer"
        d="M398.22 1007.25C404.14 1029.79 352.2 1053.97 344.76 1034.04C339.86 1020.91 343.05 987.08 355.47 980.78C369.54 973.66 394.1 991.54 398.22 1007.25Z"
        id="iso-32"
      />
      <path
        style="cursor:pointer"
        d="M358.1 1026.33C366.51 1026.23 373.35 1027.45 383.99 1014.83"
        id="ahVnr1hTO"
      />
      <path
        style="cursor:pointer"
        d="M392.57 994.77C399.46 1001.09 411.57 1000.34 419.95 996.49C429.36 992.16 436.06 981.62 439.48 971.44C442.61 962.15 439.32 939.77 429.99 940.63C410.2 942.46 390.49 930.62 383.92 948.91C378.15 964.99 381.4 984.52 392.57 994.77Z"
        id="iso-33"
      />
      <path
        style="cursor:pointer"
        d="M405.19 988.33C424.46 985.97 428.82 970.26 430.47 958.8"
        id="d2sFISoAcr"
      />
      <path
        style="cursor:pointer"
        d="M543.34 549.27C543.34 549.27 553.87 553.9 554.25 574.88C554.37 581.45 545.36 588.63 545.95 596.32C547.13 611.61 536.09 629.37 525.98 631.51C499.75 637.07 488.15 615.86 482.31 597.91C476.97 581.49 484.86 559.88 495.99 547.87C507.66 541.83 530.16 547.69 543.34 549.27Z"
        id="iso-38"
      />
      <path
        style="cursor:pointer"
        d="M460.41 658.77C468.35 639.36 488.46 628.89 509.7 634.95C528.1 640.2 539.38 651.7 542.26 678.51C544.95 703.65 546.3 733.44 503.95 730.8C463.72 728.29 443.22 700.79 460.41 658.77Z"
        id="iso-37"
      />
      <path
        style="cursor:pointer"
        d="M476.45 712.12C482.6 710.36 492.92 712.41 494.68 705.44C494.92 704.51 496.8 697.08 497.03 696.15C493.42 693.01 486.41 695.75 480.89 695.91C480.94 695.49 499.53 689.96 499.69 689.9C501.56 689.15 506.83 675.93 503 669.35C495.45 663.69 486.5 667.5 478.38 666.85C486.23 665.64 497.42 664.85 498.25 662.76C499.91 655.77 501.41 650.23 502.89 644.78C502.53 651.07 500.89 657.66 504.7 662.98C514.85 666.32 515.31 664.49 520.71 664.4C515.4 665.92 512.02 670.3 509.66 676.18C507.3 684.13 509.02 684.63 509.72 686.97C515.27 689.51 518.49 686.3 522.75 686.22C517.1 688.44 510.47 691.27 505.59 694.84C499.92 698.98 506.37 705.07 510.92 710.48C504.52 711.56 497.86 710.96 492.86 721.38C492.13 713.23 483.7 714.07 476.45 712.12Z"
        id="b5JyusjzlT"
      />
      <path
        style="cursor:pointer"
        d="M503.52 809.7C503.52 809.7 515.45 809.8 521.85 792.99C523.85 787.73 516.85 778.63 519.65 772.64C525.22 760.71 523.17 742.58 513.61 737.15C506.92 733.35 495.06 733.83 489.39 733.42C474.04 732.31 464.12 739.06 456.07 748.09C445.98 759.4 447.72 779.75 455.48 793.52C465.49 802.67 489.81 806.16 503.52 809.7Z"
        id="iso-36"
      />
      <path
        style="cursor:pointer"
        d="M504.77 581.31C501.28 583.35 494.69 579.54 489.81 578.18C491.17 579.16 502.04 586.92 503.4 587.89C507.94 595.54 505.02 601.53 504.88 608.47C508.52 607.93 511.38 611.44 514.13 615.5C513.79 611.4 509.56 604.99 514.22 603.85C514.92 604.17 518.41 605.76 524.69 608.62C518.5 603.16 515.05 600.13 514.37 599.52C514.37 599.52 512.07 593.24 514.45 594.34C516.84 595.44 528.68 593.64 528.68 593.64C528.68 593.64 516.71 593.73 512.65 588.44C508.59 583.16 508.83 580.12 508.58 576.69C508.33 573.26 509.27 569.91 507.44 567.29C505.83 564.98 499.78 563.16 499.78 563.16C502.73 569.47 504.93 575.62 504.77 581.31Z"
        id="a9wXxhEQy"
      />
      <path
        style="cursor:pointer"
        d="M420.46 927.08C423.73 935.12 433.93 939.42 442.23 939.62C451.55 939.85 460.98 933.83 467.59 926.77C473.63 920.33 481.14 889.95 473.17 886.88C456.29 880.35 443 866.85 430.78 879.36C420.04 890.37 415.14 914.04 420.46 927.08Z"
        id="iso-34"
      />
      <path
        style="cursor:pointer"
        d="M439.73 926.69C448.01 925.67 455.22 922.9 458.96 918.34C463.92 912.31 464.06 903.69 465 897.16"
        id="f1nJy2rCGI"
      />
      <path
        style="cursor:pointer"
        d="M482.1 776.04C479.29 773.15 472.37 776.45 467.55 777.21C469.02 776.32 480.76 769.22 482.22 768.33C488.06 760.35 486.62 753.07 487.97 745.15C491.22 746.35 494.62 742.81 498.04 738.63C496.85 743.24 491.57 749.86 495.65 751.9C496.36 751.65 499.94 750.39 506.38 748.13C499.47 753.36 495.64 756.26 494.87 756.84C494.87 756.84 491.4 763.63 493.85 762.75C496.29 761.87 506.9 765.81 506.9 765.81C506.9 765.81 495.81 763.81 490.92 769.17C486.03 774.54 485.61 778.03 484.65 781.89C483.7 785.76 483.86 789.71 481.6 792.41C479.62 794.78 473.61 795.89 473.61 795.89C477.69 789.18 481.04 782.53 482.1 776.04Z"
        id="m211qMeGpL"
      />
      <path
        style="cursor:pointer"
        d="M455.7 872.82C460.92 880.72 472.84 883.09 481.86 881.51C491.99 879.73 500.93 871.22 506.61 862.23C511.8 854.02 509.64 814.77 500.39 813.21C480.78 809.91 464.18 798.13 453.57 814.18C444.24 828.29 447.25 860.02 455.7 872.82Z"
        id="iso-35"
      />
      <path
        style="cursor:pointer"
        d="M499.49 836.49C498.48 838.79 499.41 841.14 499.1 843.3C498.25 849.31 497.57 854.52 494.03 858.06C492.65 859.44 491.07 860.64 489.36 861.71C484.73 864.58 479.13 866.47 474.02 868.29"
        id="bHt0uYEvE"
      />
      <path
        style="cursor:pointer"
        d="M456.81 886.97C449.6 886 442.39 885.28 437.98 887.96C430.62 892.42 428.17 902.56 425.53 909.25"
        id="aaB5NMNJEr"
      />
      <path
        style="cursor:pointer"
        d="M482.71 819.2C463.46 816.63 460.49 829.28 456.28 839.99"
        id="awAtPqnox"
      />
      <text
        id="b1BVUVOWBq"
        x="241.89"
        y="100.29"
        font-size="20"
        transform="matrix(1 0 0 1 57.80000000000004 869.8745265151554)"
      >
        <tspan
          x="241.89"
          dy="0em"
          dominant-baseline="text-before-edge"
          :stroke="teeth[31]?.concern ? 'red' : undefined"
        >31</tspan>
      </text>
      <text
        id="a3t972Cvsg"
        x="241.89"
        y="100.29"
        font-size="20"
        transform="matrix(1 0 0 1 95.73437500000031 855.2745265151555)"
      >
        <tspan
          x="241.89"
          dy="0em"
          dominant-baseline="text-before-edge"
          :stroke="teeth[32]?.concern ? 'red' : undefined"
        >32</tspan>
      </text>
      <text
        id="i4mHUxK2re"
        x="241.89"
        y="100.29"
        font-size="20"
        transform="matrix(1 0 0 1 152.8896780303037 770.7026515151549)"
      >
        <tspan
          x="241.89"
          dy="0em"
          dominant-baseline="text-before-edge"
          :stroke="teeth[34]?.concern ? 'red' : undefined"
        >34</tspan>
      </text>
      <text
        id="d3EsTPegQ"
        x="241.89"
        y="100.29"
        font-size="20"
        transform="matrix(1 0 0 1 121.07149621212173 820.8849431818218)"
      >
        <tspan
          x="241.89"
          dy="0em"
          dominant-baseline="text-before-edge"
          :stroke="teeth[33]?.concern ? 'red' : undefined"
        >33</tspan>
      </text>
      <text
        id="b2ApfidLEf"
        x="241.89"
        y="100.29"
        font-size="20"
        transform="matrix(1 0 0 1 175.7490530303037 713.8795190562305)"
      >
        <tspan
          x="241.89"
          dy="0em"
          dominant-baseline="text-before-edge"
          :stroke="teeth[35]?.concern ? 'red' : undefined"
        >35</tspan>
      </text>
      <text
        id="b2aRoIXnu9"
        x="241.89"
        y="100.29"
        font-size="20"
        transform="matrix(1 0 0 1 179.9811271272621 644.030087238048)"
      >
        <tspan
          x="241.89"
          dy="0em"
          dominant-baseline="text-before-edge"
          :stroke="teeth[36]?.concern ? 'red' : undefined"
        >36</tspan>
      </text>
      <text
        id="a1E40eZIMw"
        x="241.89"
        y="100.29"
        font-size="20"
        transform="matrix(1 0 0 1 187.17874053030374 552.0747842077441)"
      >
        <tspan
          x="241.89"
          dy="0em"
          dominant-baseline="text-before-edge"
          :stroke="teeth[37]?.concern ? 'red' : undefined"
        >37</tspan>
      </text>
      <text
        id="b18Xayl0Ve"
        x="241.89"
        y="100.29"
        font-size="20"
        transform="matrix(1 0 0 1 212.00000000000088 465.24931072289553)"
      >
        <tspan
          x="241.89"
          dy="0em"
          dominant-baseline="text-before-edge"
          :stroke="teeth[38]?.concern ? 'red' : undefined"
        >38</tspan>
      </text>
    </defs>
    <g class="main">
      <!-- Quadrant 1 -->
      <g class="q1">
        <g class="1" style="cursor:pointer" @click="emit('tooth-click', 11)">
          <g>
            <use href="#iso-11" :fill="conditionToColor(teeth[11]?.condition ?? 'sound')" />
            <g>
              <use href="#iso-11" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#iso-11a" opacity="1" fill-opacity="0" />
            <g>
              <use href="#iso-11a" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
        </g>
        <g class="2" style="cursor:pointer" @click="emit('tooth-click', 12)">
          <g>
            <use href="#iso-12" :fill="conditionToColor(teeth[12]?.condition ?? 'sound')" />
            <g>
              <use href="#iso-12" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#iso-12a" opacity="1" fill-opacity="0" />
            <g>
              <use href="#iso-12a" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
        </g>
        <g class="3" style="cursor:pointer" @click="emit('tooth-click', 13)">
          <g>
            <use href="#iso-13" :fill="conditionToColor(teeth[13]?.condition ?? 'sound')" />
            <g>
              <use href="#iso-13" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#iso-13a" opacity="1" fill-opacity="0" />
            <g>
              <use href="#iso-13a" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
        </g>
        <g class="4" style="cursor:pointer" @click="emit('tooth-click', 14)">
          <g>
            <use href="#iso-14" :fill="conditionToColor(teeth[14]?.condition ?? 'sound')" />
            <g>
              <use href="#iso-14" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#b6fpiYGql" opacity="1" fill-opacity="0" />
            <g>
              <use href="#b6fpiYGql" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#cyecxkyP8" opacity="1" fill-opacity="0" />
            <g>
              <use href="#cyecxkyP8" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
        </g>
        <g class="5" style="cursor:pointer" @click="emit('tooth-click', 15)">
          <g>
            <use href="#iso-15" :fill="conditionToColor(teeth[15]?.condition ?? 'sound')" />
            <g>
              <use href="#iso-15" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#b22znv61x" opacity="1" fill-opacity="0" />
            <g>
              <use href="#b22znv61x" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#a3AsQKojJ1" opacity="1" fill-opacity="0" />
            <g>
              <use href="#a3AsQKojJ1" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
        </g>
        <g class="6" style="cursor:pointer" @click="emit('tooth-click', 16)">
          <g>
            <use href="#iso-16" :fill="conditionToColor(teeth[16]?.condition ?? 'sound')" />
            <g>
              <use href="#iso-16" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#b6rcDQpXhc" opacity="1" fill="#000" />
            <g>
              <use href="#b6rcDQpXhc" fill-opacity="0" stroke="#000" stroke-width="0" />
            </g>
          </g>
        </g>
        <g class="7" style="cursor:pointer" @click="emit('tooth-click', 17)">
          <g>
            <use href="#iso-17" :fill="conditionToColor(teeth[17]?.condition ?? 'sound')" />
            <g>
              <use href="#iso-17" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#iso-17a" opacity="1" fill="#000" />
            <g>
              <use href="#iso-17a" fill-opacity="0" stroke="#000" stroke-width="0" />
            </g>
          </g>
        </g>
        <g class="8" style="cursor:pointer" @click="emit('tooth-click', 18)">
          <g>
            <use href="#iso-18" :fill="conditionToColor(teeth[18]?.condition ?? 'sound')" />
            <g>
              <use href="#iso-18" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#b2DYah0Bi" opacity="1" fill="#000" />
            <g>
              <use href="#b2DYah0Bi" fill-opacity="0" stroke="#000" stroke-width="0" />
            </g>
          </g>
        </g>
        <g class="text">
          <g id="e1BKNeURVa">
            <use href="#dhJLWP0Rx" opacity="1" fill="#000" />
          </g>
          <g id="c11nH75JKG">
            <use href="#h484gZh3x" opacity="1" fill="#000" />
          </g>
          <g id="apGn9cSxF">
            <use href="#a5HTD7Ziun" opacity="1" fill="#000" />
          </g>
          <g id="bjZ1YSxTN">
            <use href="#dPldy7HEx" opacity="1" fill="#000" />
          </g>
          <g id="fg2EsfBeL">
            <use href="#aagZSuMJr" opacity="1" fill="#000" />
          </g>
          <g id="a5Xmbxqft">
            <use href="#c3f2gAlj3" opacity="1" fill="#000" />
          </g>
          <g id="a3IMKLYnOx">
            <use href="#fWwh13pJ" opacity="1" fill="#000" />
          </g>
          <g id="c31CWrtXNW">
            <use href="#iALQXea9Y" opacity="1" fill="#000" />
          </g>
        </g>
      </g>
      <!-- Quadrant 2 -->
      <g class="q2">
        <g class="1" style="cursor:pointer" @click="emit('tooth-click', 21)">
          <g>
            <use href="#iso-21" :fill="conditionToColor(teeth[21]?.condition ?? 'sound')" />
            <g>
              <use href="#iso-21" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#h3ymJ8JsAJ" opacity="1" fill-opacity="0" />
            <g>
              <use href="#h3ymJ8JsAJ" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
        </g>
        <g class="2" style="cursor:pointer" @click="emit('tooth-click', 22)">
          <g>
            <use href="#iso-22" :fill="conditionToColor(teeth[22]?.condition ?? 'sound')" />
            <g>
              <use href="#iso-22" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#e7zZFZz9XZ" opacity="1" fill-opacity="0" />
            <g>
              <use href="#e7zZFZz9XZ" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
        </g>
        <g class="3" style="cursor:pointer" @click="emit('tooth-click', 23)">
          <g>
            <use href="#iso-23" :fill="conditionToColor(teeth[23]?.condition ?? 'sound')" />
            <g>
              <use href="#iso-23" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#bX8HWOfji" opacity="1" fill-opacity="0" />
            <g>
              <use href="#bX8HWOfji" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
        </g>
        <g class="4" style="cursor:pointer" @click="emit('tooth-click', 24)">
          <g>
            <use href="#iso-24" :fill="conditionToColor(teeth[24]?.condition ?? 'sound')" />
            <g>
              <use href="#iso-24" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#d6p4ZsEBwV" opacity="1" fill-opacity="0" />
            <g>
              <use href="#d6p4ZsEBwV" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#b2b6VhQYX9" opacity="1" fill-opacity="0" />
            <g>
              <use href="#b2b6VhQYX9" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
        </g>
        <g class="5" style="cursor:pointer" @click="emit('tooth-click', 25)">
          <g>
            <use href="#iso-25" :fill="conditionToColor(teeth[25]?.condition ?? 'sound')" />
            <g>
              <use href="#iso-25" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#a1IjZsIm8S" opacity="1" fill-opacity="0" />
            <g>
              <use href="#a1IjZsIm8S" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#b2JgD7E2Kq" opacity="1" fill-opacity="0" />
            <g>
              <use href="#b2JgD7E2Kq" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
        </g>
        <g class="6" style="cursor:pointer" @click="emit('tooth-click', 26)">
          <g>
            <use href="#iso-26" :fill="conditionToColor(teeth[26]?.condition ?? 'sound')" />
            <g>
              <use href="#iso-26" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#aLBv0ngyf" opacity="1" fill="#000" />
            <g>
              <use href="#aLBv0ngyf" fill-opacity="0" stroke="#000" stroke-width="0" />
            </g>
          </g>
        </g>
        <g class="7" style="cursor:pointer" @click="emit('tooth-click', 27)">
          <g>
            <use href="#iso-27" :fill="conditionToColor(teeth[27]?.condition ?? 'sound')" />
            <g>
              <use href="#iso-27" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#lmVcyt8R" opacity="1" fill="#000" />
            <g>
              <use href="#lmVcyt8R" fill-opacity="0" stroke="#000" stroke-width="0" />
            </g>
          </g>
        </g>
        <g class="8" style="cursor:pointer" @click="emit('tooth-click', 28)">
          <g>
            <use href="#iso-28" :fill="conditionToColor(teeth[28]?.condition ?? 'sound')" />
            <g>
              <use href="#iso-28" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#bsHecJRYc" opacity="1" fill="#000" />
            <g>
              <use href="#bsHecJRYc" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
        </g>
        <g class="text">
          <g id="c2vG1vlZh4">
            <use href="#b1gODCfJB5" opacity="1" fill="#000" />
          </g>
          <g id="a1nYN9cpt">
            <use href="#a2KwBh9N1C" opacity="1" fill="#000" />
          </g>
          <g id="bAKpE8e15">
            <use href="#avSr25PQ8" opacity="1" fill="#000" />
          </g>
          <g id="f13C0Z9htE">
            <use href="#b1IAgvlN7L" opacity="1" fill="#000" />
          </g>
          <g id="h2OfTRUQ6B">
            <use href="#a5jdHsmSg" opacity="1" fill="#000" />
          </g>
          <g id="b4tUNqNk6T">
            <use href="#eEJTk9OPg" opacity="1" fill="#000" />
          </g>
          <g id="clBT5njbz">
            <use href="#a1kI1wu28" opacity="1" fill="#000" />
          </g>
          <g id="aG1IO93Cx">
            <use href="#f10grZcqP0" opacity="1" fill="#000" />
          </g>
        </g>
      </g>
      <!-- Quadrant 3 -->
      <g class="q3">
        <g class="1" style="cursor:pointer" @click="emit('tooth-click', 31)">
          <g>
            <use href="#iso-31" :fill="conditionToColor(teeth[31]?.condition ?? 'sound')" />
            <g>
              <use href="#iso-31" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#cjuFfUWr" opacity="1" fill-opacity="0" />
            <g>
              <use href="#cjuFfUWr" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
        </g>
        <g class="2" style="cursor:pointer" @click="emit('tooth-click', 32)">
          <g>
            <use href="#iso-32" :fill="conditionToColor(teeth[32]?.condition ?? 'sound')" />
            <g>
              <use href="#iso-32" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#ahVnr1hTO" opacity="1" fill-opacity="0" />
            <g>
              <use href="#ahVnr1hTO" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
        </g>
        <g class="3" style="cursor:pointer" @click="emit('tooth-click', 33)">
          <g>
            <use href="#iso-33" :fill="conditionToColor(teeth[33]?.condition ?? 'sound')" />
            <g>
              <use href="#iso-33" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#d2sFISoAcr" opacity="1" fill-opacity="0" />
            <g>
              <use href="#d2sFISoAcr" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
        </g>
        <g class="4" style="cursor:pointer" @click="emit('tooth-click', 34)">
          <g>
            <use href="#iso-34" :fill="conditionToColor(teeth[34]?.condition ?? 'sound')" />
            <g>
              <use href="#iso-34" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#f1nJy2rCGI" opacity="1" fill-opacity="0" />
            <g>
              <use href="#f1nJy2rCGI" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#aaB5NMNJEr" opacity="1" fill-opacity="0" />
            <g>
              <use href="#aaB5NMNJEr" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
        </g>
        <g class="5" style="cursor:pointer" @click="emit('tooth-click', 35)">
          <g>
            <use href="#iso-35" :fill="conditionToColor(teeth[35]?.condition ?? 'sound')" />
            <g>
              <use href="#iso-35" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#bHt0uYEvE" opacity="1" fill-opacity="0" />
            <g>
              <use href="#bHt0uYEvE" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#awAtPqnox" opacity="1" fill-opacity="0" />
            <g>
              <use href="#awAtPqnox" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
        </g>
        <g class="6" style="cursor:pointer" @click="emit('tooth-click', 36)">
          <g>
            <use href="#iso-36" :fill="conditionToColor(teeth[36]?.condition ?? 'sound')" />
            <g>
              <use href="#iso-36" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#m211qMeGpL" opacity="1" fill="#000" />
            <g>
              <use href="#m211qMeGpL" fill-opacity="0" stroke="#000" stroke-width="0" />
            </g>
          </g>
        </g>
        <g class="7" style="cursor:pointer" @click="emit('tooth-click', 37)">
          <g>
            <use href="#iso-37" :fill="conditionToColor(teeth[37]?.condition ?? 'sound')" />
            <g>
              <use href="#iso-37" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#b5JyusjzlT" opacity="1" fill="#000" />
            <g>
              <use href="#b5JyusjzlT" fill-opacity="0" stroke="#000" stroke-width="0" />
            </g>
          </g>
        </g>
        <g class="8" style="cursor:pointer" @click="emit('tooth-click', 38)">
          <g>
            <use href="#iso-38" :fill="conditionToColor(teeth[38]?.condition ?? 'sound')" />
            <g>
              <use href="#iso-38" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#a9wXxhEQy" opacity="1" fill="#000" />
            <g>
              <use href="#a9wXxhEQy" fill-opacity="0" stroke="#000" stroke-width="0" />
            </g>
          </g>
        </g>
        <g class="text">
          <g id="a8me8h3BSZ">
            <use href="#b1BVUVOWBq" opacity="1" fill="#000" />
          </g>
          <g id="aXE5ZGRZF">
            <use href="#a3t972Cvsg" opacity="1" fill="#000" />
          </g>
          <g id="c3IdvmfULY">
            <use href="#i4mHUxK2re" opacity="1" fill="#000" />
          </g>
          <g id="d4igiagCc0">
            <use href="#d3EsTPegQ" opacity="1" fill="#000" />
          </g>
          <g id="b4CCaq9LOV">
            <use href="#b2ApfidLEf" opacity="1" fill="#000" />
          </g>
          <g id="ako4Nkrak">
            <use href="#b2aRoIXnu9" opacity="1" fill="#000" />
          </g>
          <g id="eBV6uRJmu">
            <use href="#a1E40eZIMw" opacity="1" fill="#000" />
          </g>
          <g id="aQUtEqY2g">
            <use href="#b18Xayl0Ve" opacity="1" fill="#000" />
          </g>
        </g>
      </g>
      <!-- Quadrant 4 -->
      <g class="q4">
        <g class="1" style="cursor:pointer" @click="emit('tooth-click', 41)">
          <g>
            <use href="#iso-41" :fill="conditionToColor(teeth[41]?.condition ?? 'sound')" />
            <g>
              <use href="#iso-41" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#a2Ot1hj5Ti" opacity="1" fill-opacity="0" />
            <g>
              <use href="#a2Ot1hj5Ti" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
        </g>
        <g class="2" style="cursor:pointer" @click="emit('tooth-click', 42)">
          <g>
            <use href="#iso-42" :fill="conditionToColor(teeth[42]?.condition ?? 'sound')" />
            <g>
              <use href="#iso-42" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#c3OkjuGmoe" opacity="1" fill-opacity="0" />
            <g>
              <use href="#c3OkjuGmoe" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
        </g>
        <g class="3" style="cursor:pointer" @click="emit('tooth-click', 43)">
          <g>
            <use href="#iso-43" :fill="conditionToColor(teeth[43]?.condition ?? 'sound')" />
            <g>
              <use href="#iso-43" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#c1DvhakQel" opacity="1" fill-opacity="0" />
            <g>
              <use href="#c1DvhakQel" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
        </g>
        <g class="4" style="cursor:pointer" @click="emit('tooth-click', 44)">
          <g>
            <use href="#iso-44" :fill="conditionToColor(teeth[44]?.condition ?? 'sound')" />
            <g>
              <use href="#iso-44" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#c2SUh81nX8" opacity="1" fill-opacity="0" />
            <g>
              <use href="#c2SUh81nX8" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#d38q1jr7XL" opacity="1" fill-opacity="0" />
            <g>
              <use href="#d38q1jr7XL" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
        </g>
        <g class="5" style="cursor:pointer" @click="emit('tooth-click', 45)">
          <g>
            <use href="#iso-45" :fill="conditionToColor(teeth[45]?.condition ?? 'sound')" />
            <g>
              <use href="#iso-45" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#c9QkCsAMn" opacity="1" fill-opacity="0" />
            <g>
              <use href="#c9QkCsAMn" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#amh0k6iSv" opacity="1" fill-opacity="0" />
            <g>
              <use href="#amh0k6iSv" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
        </g>
        <g class="6" style="cursor:pointer" @click="emit('tooth-click', 46)">
          <g>
            <use href="#iso-46" :fill="conditionToColor(teeth[46]?.condition ?? 'sound')" />
            <g>
              <use href="#iso-46" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#b3NaX9ixLx" opacity="1" fill="#000" />
            <g>
              <use href="#b3NaX9ixLx" fill-opacity="0" stroke="#000" stroke-width="0" />
            </g>
          </g>
        </g>
        <g class="7" style="cursor:pointer" @click="emit('tooth-click', 47)">
          <g>
            <use href="#iso-47" :fill="conditionToColor(teeth[47]?.condition ?? 'sound')" />
            <g>
              <use href="#iso-47" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#c18sfWQXw1" opacity="1" fill="#000" />
            <g>
              <use href="#c18sfWQXw1" fill-opacity="0" stroke="#000" stroke-width="0" />
            </g>
          </g>
        </g>
        <g class="8" style="cursor:pointer" @click="emit('tooth-click', 48)">
          <g>
            <use href="#iso-48" :fill="conditionToColor(teeth[48]?.condition ?? 'sound')" />
            <g>
              <use href="#iso-48" fill-opacity="0" stroke="#000" stroke-width="2" />
            </g>
          </g>
          <g>
            <use href="#b7ARVWKg9" opacity="1" fill="#000" />
            <g>
              <use href="#b7ARVWKg9" fill-opacity="0" stroke="#000" stroke-width="0" />
            </g>
          </g>
        </g>
        <g class="text">
          <g id="esxiVjmkn">
            <use href="#b85Z9biXKR" opacity="1" fill="#000" />
          </g>
          <g id="a5VexlPOx">
            <use href="#c1DY6ILtkz" opacity="1" fill="#000" />
          </g>
          <g id="aaP8d9N3o">
            <use href="#b7Um5lGNA6" opacity="1" fill="#000" />
          </g>
          <g id="adSaYX4L8">
            <use href="#bFYSV3ojY" opacity="1" fill="#000" />
          </g>
          <g id="f5VTtmANks">
            <use href="#a58joFtV32" opacity="1" fill="#000" />
          </g>
          <g id="akb2LDStY">
            <use href="#d1FL8DxoUa" opacity="1" fill="#000" />
          </g>
          <g id="iGZzsgY86">
            <use href="#c1WvdIbIzw" opacity="1" fill="#000" />
          </g>
          <g id="b43283rfI4">
            <use href="#g1ie3fhzhA" opacity="1" fill="#000" />
          </g>
        </g>
      </g>
    </g>
  </svg>
</template>
