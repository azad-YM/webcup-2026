<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * L5 (F27): translations of the main texts of municipal services, entered by agents.
 * Seeds English and Spanish names and summaries for the demonstration catalogue; the description
 * stays in French (the site falls back to French and says so).
 */
final class Version20261003123100 extends AbstractMigration
{
    /** id => [en name, en summary, es name, es summary] */
    private const TRANSLATIONS = [
        'etat-civil' => ['Civil registry and citizenship', 'Birth, marriage and death certificates, registration of newcomers, electoral rolls.', 'Registro civil y ciudadanía', 'Actas de nacimiento, matrimonio y defunción, empadronamiento de recién llegados, censo electoral.'],
        'sante' => ['Health', 'Medical centre, teleconsultation, vaccinations and radiation prevention.', 'Salud', 'Centro médico, teleconsulta, vacunas y prevención frente a las radiaciones.'],
        'voirie-eclairage' => ['Roads and lighting', 'Maintenance of roads and walkways between the domes, street lighting, signage.', 'Vías públicas y alumbrado', 'Mantenimiento de calles y pasarelas entre las cúpulas, alumbrado público, señalización.'],
        'transports' => ['Transport', 'Shuttles between districts, self-service rovers, timetables and passes.', 'Transporte', 'Lanzaderas entre barrios, róvers de autoservicio, horarios y abonos.'],
        'eau-energie' => ['Water and energy', 'Water supply and recycling, solar grid, connections and subscriptions.', 'Agua y energía', 'Distribución y reciclaje del agua, red solar, conexiones y contratos.'],
        'logement' => ['Housing', 'Applying for a living module, housing support, allocation to newcomers.', 'Vivienda', 'Solicitud de un módulo habitable, ayudas a la vivienda, asignación a los recién llegados.'],
        'education' => ['Education and early childhood', 'Nurseries, schools, school meals and after-school activities.', 'Educación y primera infancia', 'Guarderías, escuelas, comedor escolar y actividades extraescolares.'],
        'proprete-recyclage' => ['Cleanliness and recycling', 'Waste collection and sorting, composting for the greenhouses, bulky items.', 'Limpieza y reciclaje', 'Recogida y separación de residuos, compostaje para los invernaderos, objetos voluminosos.'],
        'hopital-nova-terra' => ['Nova Terra Hospital', 'City hospital: consultations, hospital stays, maternity and medical imaging.', 'Hospital de Nova Terra', 'Hospital de la ciudad: consultas, hospitalización, maternidad e imagen médica.'],
        'urgences-hopital' => ['Hospital emergency department', 'Emergency department open day and night for serious injuries and illness.', 'Urgencias del hospital', 'Servicio de urgencias abierto día y noche para heridas y malestares graves.'],
        'pompiers' => ['Fire and rescue station', 'Fire, accident, gas leak or person in danger: firefighters respond day and night.', 'Parque de bomberos', 'Incendio, accidente, fuga de gas o persona en peligro: los bomberos intervienen día y noche.'],
        'police-municipale' => ['Police station', 'Assault, theft, immediate danger: the police answer day and night on 17.', 'Comisaría de policía', 'Agresión, robo, peligro inmediato: la policía responde día y noche en el 17.'],
        'pharmacie-de-garde' => ['On-duty pharmacy', 'Medicines in the evening, at night, on Sundays and public holidays.', 'Farmacia de guardia', 'Medicamentos por la tarde, por la noche, los domingos y festivos.'],
    ];

    public function getDescription(): string
    {
        return 'L5 (F27): translations (en, es) of the names and summaries of municipal services.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE municipal_service ADD translations JSON DEFAULT NULL');
        foreach (self::TRANSLATIONS as $id => [$enName, $enSummary, $esName, $esSummary]) {
            $translations = [
                'en' => ['name' => $enName, 'summary' => $enSummary, 'description' => ''],
                'es' => ['name' => $esName, 'summary' => $esSummary, 'description' => ''],
            ];
            $this->addSql('UPDATE municipal_service SET translations = ? WHERE id = ?', [json_encode($translations, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), $id]);
        }
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE municipal_service DROP translations');
    }
}
