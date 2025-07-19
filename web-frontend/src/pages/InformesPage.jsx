
import Header from '../components/Header';
import InformesComponent from '../components/InformesComponent';
import BackgroundComponent from '../components/BackgroundComponent';

function InformesPage() {
  return (
    <BackgroundComponent header={<Header />}>

      <main className="informes-container">
        <InformesComponent />
        {/* Aquí puedes agregar más contenido HTML o componentes */}
      </main>
    </BackgroundComponent>
  );
}

export default InformesPage;