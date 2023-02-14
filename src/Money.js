

const moneyFormat = (value) =>
  new Intl.NumberFormat('en-ZW', {
    style: 'currency',
    currency: 'USD'
  }).format(value);


function Money(props) {
    return (
        <span>
            {moneyFormat(props.value)}
        </span>
    )
}

export default Money;