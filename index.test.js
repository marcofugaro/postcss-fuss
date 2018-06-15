const postcss = require('postcss')
const plugin = require('./')
const fussFunctions = require('./fuss-functions')

function removeSpaces(s) {
    return s.toString().replace(/[\n\s]+/g, '')
}

function run(input, output) {
    const fuss = plugin({ functions: fussFunctions })

    return postcss([fuss]).process(input).then(result => {
        expect(removeSpaces(result.css)).toEqual(removeSpaces(output))
        expect(result.warnings().length).toBe(0)
    })
}

it('does not mangle existing CSS', () => run('.asd {}', '.asd {}'))

it('does transform a @fuss function', () => run(`
    @fuss color(blue, #00f);
`, `
    /* color(blue, #00f) */
    .blue { color: #00f }
    .bg-blue { background-color: #00f }
    .b--blue { border-color: #00f }
`))

it('does transform a @fuss function containing css variables', () => run(`
    @fuss color(blue, var(--blue));
`, `
    /* color(blue, var(--blue)) */
    .blue { color: var(--blue) }
    .bg-blue { background-color: var(--blue) }
    .b--blue { border-color: var(--blue) }
`))

it('does transform a @fuss second-order function', () => run(`
    @fuss color-variants() {
        .gray { color: #ccc }
    }
`, `
    /* color-variants() */
    .gray { color: #ccc }
    .gray-light { color: color-mod(#ccc lightness(+15%)) }
    .gray-dark { color: color-mod(#ccc lightness(-15%)) }
`))

it('does transform a @fuss block function', () => run(`
    @fuss responsive() {
      .w-50 { width: 50% }
    }
`, `
    /* responsive() */
    .w-50 { width: 50% }
    @media screen and (min-width: 480px) and (max-width: 1024px) {
        .w-50-m { width: 50% }
    }
    @media screen and (min-width: 1024px) {
        .w-50-l { width: 50% }
    }
`))

it('does transform a @fuss block function with a @fuss fn inside', () => run(`
    @fuss responsive() {
      @fuss color(red, #f00);
    }
`, `
    /* responsive() */

    /* color(red, #f00) */
    .red { color: #f00 }
    .bg-red { background-color: #f00 }
    .b--red { border-color: #f00 }

    /* color(red, #f00) */
    @media screen and (min-width: 480px) and (max-width: 1024px) {
        .red-m { color: #f00 }
    }
    @media screen and (min-width: 480px) and (max-width: 1024px) {
        .bg-red-m { background-color: #f00 }
    }
    @media screen and (min-width: 480px) and (max-width: 1024px) {
        .b--red-m { border-color: #f00 }
    }

    /* color(red, #f00) */
    @media screen and (min-width: 1024px) {
        .red-l { color: #f00 }
    }
    @media screen and (min-width: 1024px) {
        .bg-red-l { background-color: #f00 }
    }
    @media screen and (min-width: 1024px) {
        .b--red-l { border-color: #f00 }
    }

`))
